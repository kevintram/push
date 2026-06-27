import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import ts from 'typescript'

const ROOT_DIR = path.resolve('src')
const MAX_COMPONENTS_PER_FILE = 2
const PASCAL_CASE_COMPONENT_NAME = /^[A-Z][A-Za-z0-9_]*$/u
const COMPONENT_WRAPPER_NAMES = new Set([
	'memo',
	'forwardRef',
	'lazy',
	'observer',
])

function collectTsxFiles(dirPath) {
	const files = []

	for (const entry of readdirSync(dirPath, { withFileTypes: true })) {
		const entryPath = path.join(dirPath, entry.name)

		if (entry.isDirectory()) {
			files.push(...collectTsxFiles(entryPath))
			continue
		}

		if (entry.name.endsWith('.tsx')) {
			files.push(entryPath)
		}
	}

	return files
}

function shouldCheck(filePath) {
	return !(
		filePath.includes(`${path.sep}components${path.sep}ui${path.sep}`) ||
		filePath.endsWith('.test.tsx')
	)
}

function isPascalCaseComponentName(name) {
	return PASCAL_CASE_COMPONENT_NAME.test(name)
}

function hasJsxLikeSyntax(node) {
	let foundJsx = false

	function visit(currentNode) {
		if (foundJsx) return

		if (
			ts.isJsxElement(currentNode) ||
			ts.isJsxSelfClosingElement(currentNode) ||
			ts.isJsxFragment(currentNode)
		) {
			foundJsx = true
			return
		}

		if (
			ts.isCallExpression(currentNode) &&
			((ts.isIdentifier(currentNode.expression) &&
				['jsx', 'jsxs', '_jsx', '_jsxs'].includes(
					currentNode.expression.text,
				)) ||
				(ts.isPropertyAccessExpression(currentNode.expression) &&
					currentNode.expression.name.text === 'createElement'))
		) {
			foundJsx = true
			return
		}

		ts.forEachChild(currentNode, visit)
	}

	visit(node)
	return foundJsx
}

function unwrapExpression(expression) {
	let currentExpression = expression

	while (
		ts.isParenthesizedExpression(currentExpression) ||
		ts.isAsExpression(currentExpression) ||
		ts.isSatisfiesExpression(currentExpression) ||
		ts.isTypeAssertionExpression(currentExpression) ||
		ts.isNonNullExpression(currentExpression)
	) {
		currentExpression = currentExpression.expression
	}

	return currentExpression
}

function getCallName(expression) {
	if (ts.isIdentifier(expression)) return expression.text
	if (ts.isPropertyAccessExpression(expression)) return expression.name.text
	return null
}

function createComponentDeclarationIndex(sourceFile) {
	const declarationsByName = new Map()

	for (const statement of sourceFile.statements) {
		if (ts.isFunctionDeclaration(statement) && statement.name !== null) {
			declarationsByName.set(statement.name.text, {
				name: statement.name.text,
				node: statement,
				kind: 'function',
			})
			continue
		}

		if (!ts.isVariableStatement(statement)) continue

		for (const declaration of statement.declarationList.declarations) {
			if (
				!ts.isIdentifier(declaration.name) ||
				declaration.initializer === null
			) {
				continue
			}

			declarationsByName.set(declaration.name.text, {
				name: declaration.name.text,
				node: declaration,
				kind: 'variable',
			})
		}
	}

	return declarationsByName
}

function isComponentFunctionLike(node) {
	if (!(ts.isArrowFunction(node) || ts.isFunctionExpression(node))) {
		return false
	}

	if (ts.isBlock(node.body)) {
		return hasJsxLikeSyntax(node.body)
	}

	return hasJsxLikeSyntax(node.body)
}

function isLazyInitializer(expression) {
	const normalizedExpression = unwrapExpression(expression)

	return (
		ts.isArrowFunction(normalizedExpression) ||
		ts.isFunctionExpression(normalizedExpression) ||
		ts.isIdentifier(normalizedExpression)
	)
}

function isComponentInitializer(
	expression,
	declarationsByName,
	seenNames = new Set(),
) {
	const normalizedExpression = unwrapExpression(expression)

	if (isComponentFunctionLike(normalizedExpression)) {
		return true
	}

	if (!ts.isCallExpression(normalizedExpression)) return false

	const callName = getCallName(
		unwrapExpression(normalizedExpression.expression),
	)
	if (
		callName === null ||
		!COMPONENT_WRAPPER_NAMES.has(callName) ||
		normalizedExpression.arguments.length === 0
	) {
		return false
	}

	const firstArgument = unwrapExpression(normalizedExpression.arguments[0])

	if (callName === 'lazy') {
		return isLazyInitializer(firstArgument)
	}

	if (ts.isIdentifier(firstArgument)) {
		const referencedDeclaration = declarationsByName.get(firstArgument.text)
		if (
			referencedDeclaration === null ||
			seenNames.has(firstArgument.text)
		) {
			return false
		}

		const nextSeenNames = new Set(seenNames)
		nextSeenNames.add(firstArgument.text)
		return isComponentDeclaration(
			referencedDeclaration,
			declarationsByName,
			nextSeenNames,
		)
	}

	return isComponentInitializer(firstArgument, declarationsByName, seenNames)
}

function isComponentDeclaration(
	declaration,
	declarationsByName,
	seenNames = new Set(),
) {
	if (!isPascalCaseComponentName(declaration.name)) {
		return false
	}

	if (declaration.kind === 'function') {
		return (
			declaration.node.body !== null &&
			hasJsxLikeSyntax(declaration.node.body)
		)
	}

	return isComponentInitializer(
		declaration.node.initializer,
		declarationsByName,
		seenNames,
	)
}

function getNodeLine(sourceFile, node) {
	return (
		sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
			.line + 1
	)
}

function collectTopLevelComponents(source, filePath) {
	const sourceFile = ts.createSourceFile(
		filePath,
		source,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	)
	const declarationsByName = createComponentDeclarationIndex(sourceFile)
	const components = []

	for (const declaration of declarationsByName.values()) {
		if (!isComponentDeclaration(declaration, declarationsByName)) continue

		components.push({
			name: declaration.name,
			line: getNodeLine(sourceFile, declaration.node),
		})
	}

	components.sort((left, right) => left.line - right.line)
	return components
}

const offenders = collectTsxFiles(ROOT_DIR)
	.filter(shouldCheck)
	.map(filePath => {
		const source = readFileSync(filePath, 'utf8')
		const components = collectTopLevelComponents(source, filePath)
		return {
			filePath,
			componentCount: components.length,
			components,
		}
	})
	.filter(result => result.componentCount > MAX_COMPONENTS_PER_FILE)
	.sort((left, right) => right.componentCount - left.componentCount)

if (offenders.length === 0) {
	process.exit(0)
}

for (const _offender of offenders) {
}

process.exit(1)
