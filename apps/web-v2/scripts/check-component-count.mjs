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
	return !filePath.endsWith('.test.tsx')
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
		if (
			ts.isFunctionDeclaration(statement) &&
			statement.name !== undefined
		) {
			declarationsByName.set(statement.name.text, statement)
			continue
		}

		if (!ts.isVariableStatement(statement)) continue

		for (const declaration of statement.declarationList.declarations) {
			if (
				ts.isIdentifier(declaration.name) &&
				declaration.initializer !== undefined
			) {
				declarationsByName.set(declaration.name.text, declaration)
			}
		}
	}

	return declarationsByName
}

function isComponentFunctionLike(node) {
	if (!(ts.isArrowFunction(node) || ts.isFunctionExpression(node))) {
		return false
	}

	return hasJsxLikeSyntax(node.body)
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

	const [firstArg] = normalizedExpression.arguments
	if (firstArg === undefined) return false

	const unwrappedArg = unwrapExpression(firstArg)
	if (isComponentFunctionLike(unwrappedArg)) {
		return true
	}

	if (ts.isIdentifier(unwrappedArg)) {
		if (seenNames.has(unwrappedArg.text)) return false
		seenNames.add(unwrappedArg.text)
		const declaration = declarationsByName.get(unwrappedArg.text)
		if (declaration === undefined) return false

		if (ts.isFunctionDeclaration(declaration)) {
			return hasJsxLikeSyntax(declaration)
		}

		if (ts.isVariableDeclaration(declaration)) {
			return declaration.initializer
				? isComponentInitializer(
						declaration.initializer,
						declarationsByName,
						seenNames,
					)
				: false
		}
	}

	return false
}

function findComponents(sourceFile) {
	const declarationsByName = createComponentDeclarationIndex(sourceFile)
	const components = []

	for (const [name, declaration] of declarationsByName) {
		if (!isPascalCaseComponentName(name)) continue

		if (
			ts.isFunctionDeclaration(declaration) &&
			hasJsxLikeSyntax(declaration)
		) {
			components.push(name)
			continue
		}

		if (
			ts.isVariableDeclaration(declaration) &&
			declaration.initializer !== undefined &&
			isComponentInitializer(declaration.initializer, declarationsByName)
		) {
			components.push(name)
		}
	}

	return components
}

const failures = []

for (const filePath of collectTsxFiles(ROOT_DIR).filter(shouldCheck)) {
	const sourceText = readFileSync(filePath, 'utf8')
	const sourceFile = ts.createSourceFile(
		filePath,
		sourceText,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TSX,
	)
	const components = findComponents(sourceFile)

	if (components.length > MAX_COMPONENTS_PER_FILE) {
		failures.push({ components, filePath })
	}
}

if (failures.length > 0) {
	for (const failure of failures) {
		console.error(
			`${failure.filePath} contains ${failure.components.length} React components: ${failure.components.join(', ')}`,
		)
	}
	process.exit(1)
}
