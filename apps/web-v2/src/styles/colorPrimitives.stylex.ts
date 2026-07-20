import * as stylex from '@stylexjs/stylex'

/**
 * When pulling from these primitives ALWAYS match semantic intent:
 * | Step | Semantic alias | Intended use |
 * | ---: | --- | --- |
 * | 1 | `base` | App or section background. |
 * | 2 | `backgroundSubtle` | Subtle background, panel, or alternate canvas. |
 * | 3 | `background` | Resting interactive component background. |
 * | 4 | `backgroundHover` | Hovered component background. |
 * | 5 | `backgroundActive` | Active/selected component background. |
 * | 6 | `line` | Subtle non-interactive line or border. |
 * | 7 | `border` | Resting interactive border. |
 * | 8 | `borderHover` | Strong/hovered border and focus ring. |
 * | 9 | `solid` | Solid control or graphic background. |
 * | 10 | `solidHover` | Hovered solid background. |
 * | 11 | `text` | Lower-emphasis readable text. |
 * | 12 | `textStrong` | High-emphasis text. |
 */

const SUPPORTS_OKLCH = '@supports (color: oklch(0% 0 0))'

export const baseColors = stylex.defineVars({
	white: { default: '#ffffff', [SUPPORTS_OKLCH]: 'oklch(100% 0 0)' },
	black: { default: '#000000', [SUPPORTS_OKLCH]: 'oklch(0% 0 0)' },
})

export const grayLight = stylex.defineVars({
	s1: {
		default: '#fcfcfc',
		[SUPPORTS_OKLCH]: 'oklch(99.10688966% 4e-8 0)',
	},
	s2: {
		default: '#f9f9f9',
		[SUPPORTS_OKLCH]: 'oklch(98.21176332% 4e-8 0)',
	},
	s3: {
		default: '#f0f0f0',
		[SUPPORTS_OKLCH]: 'oklch(95.5140044% 4e-8 0)',
	},
	s4: {
		default: '#f4f4f4',
		[SUPPORTS_OKLCH]: 'oklch(96.74468090% 3e-8 0)',
	},
	s5: {
		default: '#e0e0e0',
		[SUPPORTS_OKLCH]: 'oklch(90.67006857% 3e-8 0)',
	},
	s6: {
		default: '#d9d9d9',
		[SUPPORTS_OKLCH]: 'oklch(88.53053083% 3e-8 0)',
	},
	s7: {
		default: '#cecece',
		[SUPPORTS_OKLCH]: 'oklch(85.14193359% 3e-8 0)',
	},
	s8: {
		default: '#bbbbbb',
		[SUPPORTS_OKLCH]: 'oklch(79.20743356% 3e-8 0)',
	},
	s9: {
		default: '#8d8d8d',
		[SUPPORTS_OKLCH]: 'oklch(64.34092157% 2e-8 0)',
	},
	s10: {
		default: '#838383',
		[SUPPORTS_OKLCH]: 'oklch(60.99864452% 2e-8 0)',
	},
	s11: {
		default: '#646464',
		[SUPPORTS_OKLCH]: 'oklch(50.32293351% 2e-8 0)',
	},
	s12: {
		default: '#202020',
		[SUPPORTS_OKLCH]: 'oklch(24.35347407% 1e-8 0)',
	},
})

export const grayDark = stylex.defineVars({
	s1: {
		default: '#111111',
		[SUPPORTS_OKLCH]: 'oklch(17.76377719% 1e-8 0)',
	},
	s2: {
		default: '#191919',
		[SUPPORTS_OKLCH]: 'oklch(21.34225057% 1e-8 0)',
	},
	s3: {
		default: '#222222',
		[SUPPORTS_OKLCH]: 'oklch(25.19647482% 1e-8 0)',
	},
	s4: {
		default: '#202020',
		[SUPPORTS_OKLCH]: 'oklch(24.27928142% 1e-8 0)',
	},
	s5: {
		default: '#313131',
		[SUPPORTS_OKLCH]: 'oklch(31.31671274% 1e-8 0)',
	},
	s6: {
		default: '#3a3a3a',
		[SUPPORTS_OKLCH]: 'oklch(34.84596521% 1e-8 0)',
	},
	s7: {
		default: '#484848',
		[SUPPORTS_OKLCH]: 'oklch(40.16665168% 1e-8 0)',
	},
	s8: {
		default: '#606060',
		[SUPPORTS_OKLCH]: 'oklch(48.90564453% 2e-8 0)',
	},
	s9: {
		default: '#6e6e6e',
		[SUPPORTS_OKLCH]: 'oklch(53.82366586% 2e-8 0)',
	},
	s10: {
		default: '#7b7b7b',
		[SUPPORTS_OKLCH]: 'oklch(58.29156747% 2e-8 0)',
	},
	s11: {
		default: '#b4b4b4',
		[SUPPORTS_OKLCH]: 'oklch(76.99314125% 3e-8 0)',
	},
	s12: {
		default: '#eeeeee',
		[SUPPORTS_OKLCH]: 'oklch(94.91192544% 4e-8 0)',
	},
})

export const grayAlphaLight = stylex.defineVars({
	s1: {
		default: '#00000003',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.012)',
	},
	s2: {
		default: '#00000006',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.024)',
	},
	s3: {
		default: '#0000000f',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.059)',
	},
	s4: {
		default: '#00000017',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.09)',
	},
	s5: {
		default: '#0000001f',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.122)',
	},
	s6: {
		default: '#00000026',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.149)',
	},
	s7: {
		default: '#00000031',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.192)',
	},
	s8: {
		default: '#00000044',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.267)',
	},
	s9: {
		default: '#00000072',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.447)',
	},
	s10: {
		default: '#0000007c',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.486)',
	},
	s11: {
		default: '#0000009b',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.608)',
	},
	s12: {
		default: '#000000df',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.875)',
	},
})

export const grayAlphaDark = stylex.defineVars({
	s1: {
		default: '#00000000',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0)',
	},
	s2: {
		default: '#ffffff09',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.035)',
	},
	s3: {
		default: '#ffffff12',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.071)',
	},
	s4: {
		default: '#ffffff1b',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.106)',
	},
	s5: {
		default: '#ffffff22',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.133)',
	},
	s6: {
		default: '#ffffff2c',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.173)',
	},
	s7: {
		default: '#ffffff3b',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.231)',
	},
	s8: {
		default: '#ffffff55',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.333)',
	},
	s9: {
		default: '#ffffff64',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.392)',
	},
	s10: {
		default: '#ffffff72',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.447)',
	},
	s11: {
		default: '#ffffffaf',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.686)',
	},
	s12: {
		default: '#ffffffed',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 0 / 0.929)',
	},
})

export const sandLight = stylex.defineVars({
	s1: {
		default: '#fdfdfc',
		[SUPPORTS_OKLCH]: 'oklch(99.36955021% 0.00110605 106.41917387)',
	},
	s2: {
		default: '#f9f9f8',
		[SUPPORTS_OKLCH]: 'oklch(98.22088057% 0.00147896 106.42640107)',
	},
	s3: {
		default: '#f1f0ef',
		[SUPPORTS_OKLCH]: 'oklch(95.55179629% 0.00225697 97.61392029)',
	},
	s4: {
		default: '#f4f4f1',
		[SUPPORTS_OKLCH]: 'oklch(96.56630995% 0.00338507 100.55529859)',
	},
	s5: {
		default: '#e2e1de',
		[SUPPORTS_OKLCH]: 'oklch(90.9897203% 0.00382532 95.90900852)',
	},
	s6: {
		default: '#dad9d6',
		[SUPPORTS_OKLCH]: 'oklch(88.55114247% 0.00497327 98.33652071)',
	},
	s7: {
		default: '#cfceca',
		[SUPPORTS_OKLCH]: 'oklch(85.2512% 0.00620575 96.60395294)',
	},
	s8: {
		default: '#bcbbb5',
		[SUPPORTS_OKLCH]: 'oklch(79.18200458% 0.00829575 96.4970152)',
	},
	s9: {
		default: '#8d8d86',
		[SUPPORTS_OKLCH]: 'oklch(64.13414126% 0.01026458 106.68550189)',
	},
	s10: {
		default: '#82827c',
		[SUPPORTS_OKLCH]: 'oklch(60.5669842% 0.00957974 106.68218082)',
	},
	s11: {
		default: '#63635e',
		[SUPPORTS_OKLCH]: 'oklch(49.78584939% 0.00787374 106.68215336)',
	},
	s12: {
		default: '#21201c',
		[SUPPORTS_OKLCH]: 'oklch(24.34415831% 0.00793065 96.3134468)',
	},
})

export const sandDark = stylex.defineVars({
	s1: {
		default: '#111110',
		[SUPPORTS_OKLCH]: 'oklch(17.75573438% 0.00226512 106.62802319)',
	},
	s2: {
		default: '#191918',
		[SUPPORTS_OKLCH]: 'oklch(21.29279814% 0.00216527 106.58201436)',
	},
	s3: {
		default: '#222221',
		[SUPPORTS_OKLCH]: 'oklch(25.31017365% 0.00310971 106.61966901)',
	},
	s4: {
		default: '#1f1f1d',
		[SUPPORTS_OKLCH]: 'oklch(23.84514204% 0.00355344 99.02452789)',
	},
	s5: {
		default: '#31312e',
		[SUPPORTS_OKLCH]: 'oklch(31.23810884% 0.00444152 100.73036581)',
	},
	s6: {
		default: '#3b3a37',
		[SUPPORTS_OKLCH]: 'oklch(34.90856737% 0.00574624 102.24443907)',
	},
	s7: {
		default: '#494844',
		[SUPPORTS_OKLCH]: 'oklch(40.07198634% 0.00702603 96.10420138)',
	},
	s8: {
		default: '#62605b',
		[SUPPORTS_OKLCH]: 'oklch(49.01048405% 0.00950391 91.72857426)',
	},
	s9: {
		default: '#6f6d66',
		[SUPPORTS_OKLCH]: 'oklch(53.45695002% 0.01096458 94.07400038)',
	},
	s10: {
		default: '#7c7b74',
		[SUPPORTS_OKLCH]: 'oklch(58.10668941% 0.01074308 94.04730909)',
	},
	s11: {
		default: '#b5b3ad',
		[SUPPORTS_OKLCH]: 'oklch(76.66421895% 0.00913533 97.38309642)',
	},
	s12: {
		default: '#eeeeec',
		[SUPPORTS_OKLCH]: 'oklch(94.83133607% 0.00261063 106.44906013)',
	},
})

export const sandAlphaLight = stylex.defineVars({
	s1: {
		default: '#55550003',
		[SUPPORTS_OKLCH]: 'oklch(44.79457462% 0.11022417 110.13057746 / 0.012)',
	},
	s2: {
		default: '#25250007',
		[SUPPORTS_OKLCH]: 'oklch(27.21030223% 0.05991993 109.79840534 / 0.028)',
	},
	s3: {
		default: '#20100010',
		[SUPPORTS_OKLCH]: 'oklch(17.24566785% 0.03630154 109.67036615 / 0.063)',
	},
	s4: {
		default: '#1f150019',
		[SUPPORTS_OKLCH]: 'oklch(23.91479701% 0.05470297 109.90937541 / 0.099)',
	},
	s5: {
		default: '#1f180021',
		[SUPPORTS_OKLCH]: 'oklch(18.43722257% 0.03750259 83.24733643 / 0.126)',
	},
	s6: {
		default: '#19130029',
		[SUPPORTS_OKLCH]: 'oklch(19.11569084% 0.04216112 90.02511699 / 0.161)',
	},
	s7: {
		default: '#19140035',
		[SUPPORTS_OKLCH]: 'oklch(20.61048498% 0.04958192 110.06095986 / 0.208)',
	},
	s8: {
		default: '#1915014a',
		[SUPPORTS_OKLCH]: 'oklch(18.49737603% 0.04166244 101.90862997 / 0.287)',
	},
	s9: {
		default: '#0f0f0079',
		[SUPPORTS_OKLCH]: 'oklch(15.39243151% 0.03428689 109.83160464 / 0.471)',
	},
	s10: {
		default: '#0c0c0083',
		[SUPPORTS_OKLCH]: 'oklch(14.88330256% 0.03780072 110.22980661 / 0.514)',
	},
	s11: {
		default: '#080800a1',
		[SUPPORTS_OKLCH]: 'oklch(12.9157868% 0.03280361 110.22980661 / 0.632)',
	},
	s12: {
		default: '#060500e3',
		[SUPPORTS_OKLCH]: 'oklch(11.3880777% 0.02778208 103.24890534 / 0.891)',
	},
})

export const sandAlphaDark = stylex.defineVars({
	s1: {
		default: '#00000000',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0)',
	},
	s2: {
		default: '#f4f4f309',
		[SUPPORTS_OKLCH]: 'oklch(99.36178458% 0.0014747 106.426006 / 0.034)',
	},
	s3: {
		default: '#f6f6f513',
		[SUPPORTS_OKLCH]: 'oklch(99.66547179% 0.00147357 106.42590252 / 0.072)',
	},
	s4: {
		default: '#fefef31b',
		[SUPPORTS_OKLCH]: 'oklch(99.09584751% 0.01436531 106.65884005 / 0.106)',
	},
	s5: {
		default: '#fbfbeb23',
		[SUPPORTS_OKLCH]: 'oklch(99.73312321% 0.01287406 106.63070877 / 0.135)',
	},
	s6: {
		default: '#fffaed2d',
		[SUPPORTS_OKLCH]: 'oklch(98.34418283% 0.01910807 81.0272328 / 0.177)',
	},
	s7: {
		default: '#fffbed3c',
		[SUPPORTS_OKLCH]: 'oklch(98.7184516% 0.02090992 91.48756642 / 0.236)',
	},
	s8: {
		default: '#fff9eb57',
		[SUPPORTS_OKLCH]: 'oklch(98.31504305% 0.02044031 82.83506822 / 0.341)',
	},
	s9: {
		default: '#fffae965',
		[SUPPORTS_OKLCH]: 'oklch(98.50214827% 0.02130811 87.8860495 / 0.395)',
	},
	s10: {
		default: '#fffdee73',
		[SUPPORTS_OKLCH]: 'oklch(99.12269644% 0.0218325 99.55665966 / 0.45)',
	},
	s11: {
		default: '#fffcf4b0',
		[SUPPORTS_OKLCH]: 'oklch(99.51585625% 0.01293495 100.54209499 / 0.685)',
	},
	s12: {
		default: '#fffffded',
		[SUPPORTS_OKLCH]: 'oklch(99.9380037% 0.00294465 106.45255916 / 0.929)',
	},
})

export const redLight = stylex.defineVars({
	s1: {
		default: '#fffcfc',
		[SUPPORTS_OKLCH]: 'oklch(99.35122112% 0.00310992 22.75375413)',
	},
	s2: {
		default: '#fff7f7',
		[SUPPORTS_OKLCH]: 'oklch(98.31729899% 0.00828343 16.02500199)',
	},
	s3: {
		default: '#feebec',
		[SUPPORTS_OKLCH]: 'oklch(95.61071439% 0.02096805 16.22769871)',
	},
	s4: {
		default: '#ffdbdc',
		[SUPPORTS_OKLCH]: 'oklch(92.81038036% 0.0472813 16.68232611)',
	},
	s5: {
		default: '#ffcdce',
		[SUPPORTS_OKLCH]: 'oklch(89.61226255% 0.06198179 17.32849929)',
	},
	s6: {
		default: '#fdbdbe',
		[SUPPORTS_OKLCH]: 'oklch(85.70005863% 0.07462449 17.86795317)',
	},
	s7: {
		default: '#f4a9aa',
		[SUPPORTS_OKLCH]: 'oklch(80.72207754% 0.08945076 18.44492354)',
	},
	s8: {
		default: '#eb8e90',
		[SUPPORTS_OKLCH]: 'oklch(74.49790775% 0.11325839 19.08914583)',
	},
	s9: {
		default: '#e5484d',
		[SUPPORTS_OKLCH]: 'oklch(62.5441979% 0.19347125 22.98273027)',
	},
	s10: {
		default: '#dc3e42',
		[SUPPORTS_OKLCH]: 'oklch(59.99023564% 0.19524232 23.88946733)',
	},
	s11: {
		default: '#ce2c31',
		[SUPPORTS_OKLCH]: 'oklch(55.72459125% 0.19775028 25.13488873)',
	},
	s12: {
		default: '#641723',
		[SUPPORTS_OKLCH]: 'oklch(33.91284185% 0.10903715 16.68058885)',
	},
})

export const redDark = stylex.defineVars({
	s1: {
		default: '#191111',
		[SUPPORTS_OKLCH]: 'oklch(18.80139019% 0.01333129 19.38926297)',
	},
	s2: {
		default: '#201314',
		[SUPPORTS_OKLCH]: 'oklch(20.47864403% 0.02151648 14.73551329)',
	},
	s3: {
		default: '#3b1219',
		[SUPPORTS_OKLCH]: 'oklch(25.04387597% 0.06428379 13.10616113)',
	},
	s4: {
		default: '#500f1c',
		[SUPPORTS_OKLCH]: 'oklch(28.88419331% 0.0958711 14.28900974)',
	},
	s5: {
		default: '#611623',
		[SUPPORTS_OKLCH]: 'oklch(33.15591069% 0.10656839 15.53159277)',
	},
	s6: {
		default: '#72232d',
		[SUPPORTS_OKLCH]: 'oklch(38.2614539% 0.11135423 16.9293033)',
	},
	s7: {
		default: '#8c333a',
		[SUPPORTS_OKLCH]: 'oklch(45.05511241% 0.12062411 18.91046833)',
	},
	s8: {
		default: '#b54548',
		[SUPPORTS_OKLCH]: 'oklch(54.35585597% 0.14651281 21.43728035)',
	},
	s9: {
		default: '#e5484d',
		[SUPPORTS_OKLCH]: 'oklch(62.5441979% 0.19347125 22.98273027)',
	},
	s10: {
		default: '#ec5d5e',
		[SUPPORTS_OKLCH]: 'oklch(66.46368765% 0.17733692 23.09221183)',
	},
	s11: {
		default: '#ff9592',
		[SUPPORTS_OKLCH]: 'oklch(78.36585751% 0.16185153 22.28845165)',
	},
	s12: {
		default: '#ffd1d9',
		[SUPPORTS_OKLCH]: 'oklch(90.21540109% 0.05283186 6.13932602)',
	},
})

export const redAlphaLight = stylex.defineVars({
	s1: {
		default: '#ff000003',
		[SUPPORTS_OKLCH]: 'oklch(48.5069836% 0.22072788 28.57433882 / 0.012)',
	},
	s2: {
		default: '#ff000008',
		[SUPPORTS_OKLCH]: 'oklch(58.1656354% 0.26631993 28.73405559 / 0.028)',
	},
	s3: {
		default: '#f3000d14',
		[SUPPORTS_OKLCH]: 'oklch(54.4607612% 0.25061643 28.86663615 / 0.075)',
	},
	s4: {
		default: '#ff000824',
		[SUPPORTS_OKLCH]: 'oklch(64.89441378% 0.29904954 28.90397106 / 0.134)',
	},
	s5: {
		default: '#ff000632',
		[SUPPORTS_OKLCH]: 'oklch(60.83431951% 0.28021799 28.89241747 / 0.189)',
	},
	s6: {
		default: '#f8000442',
		[SUPPORTS_OKLCH]: 'oklch(56.51157239% 0.25921791 29.09290343 / 0.251)',
	},
	s7: {
		default: '#df000356',
		[SUPPORTS_OKLCH]: 'oklch(51.87479661% 0.23787835 29.07558757 / 0.33)',
	},
	s8: {
		default: '#d2000571',
		[SUPPORTS_OKLCH]: 'oklch(49.60756166% 0.22768542 29.02733133 / 0.428)',
	},
	s9: {
		default: '#db0007b7',
		[SUPPORTS_OKLCH]: 'oklch(52.23603184% 0.24042724 29.06911066 / 0.675)',
	},
	s10: {
		default: '#d10005c1',
		[SUPPORTS_OKLCH]: 'oklch(50.44040082% 0.23166257 29.14345554 / 0.714)',
	},
	s11: {
		default: '#c40006d3',
		[SUPPORTS_OKLCH]: 'oklch(55.72459125% 0.19775028 25.13488873)',
	},
	s12: {
		default: '#55000de8',
		[SUPPORTS_OKLCH]: 'oklch(33.91284185% 0.10903715 16.68058885)',
	},
})

export const redAlphaDark = stylex.defineVars({
	s1: {
		default: '#f4121209',
		[SUPPORTS_OKLCH]: 'oklch(64.4405456% 0.29150154 28.42424869 / 0.03)',
	},
	s2: {
		default: '#f22f3e11',
		[SUPPORTS_OKLCH]: 'oklch(68.31639864% 0.25773986 24.87992196 / 0.055)',
	},
	s3: {
		default: '#ff173f2d',
		[SUPPORTS_OKLCH]: 'oklch(66.56093988% 0.28104878 21.79959928 / 0.156)',
	},
	s4: {
		default: '#fe0a3b44',
		[SUPPORTS_OKLCH]: 'oklch(65.99912464% 0.28778573 21.02514699 / 0.236)',
	},
	s5: {
		default: '#ff204756',
		[SUPPORTS_OKLCH]: 'oklch(67.33369311% 0.27316054 20.16820425 / 0.303)',
	},
	s6: {
		default: '#ff3e5668',
		[SUPPORTS_OKLCH]: 'oklch(69.6950326% 0.2477913 19.39531282 / 0.374)',
	},
	s7: {
		default: '#ff536184',
		[SUPPORTS_OKLCH]: 'oklch(72.03878452% 0.2229212 20.34313183 / 0.475)',
	},
	s8: {
		default: '#ff5d61b0',
		[SUPPORTS_OKLCH]: 'oklch(72.98789009% 0.21284224 21.92134559 / 0.635)',
	},
	s9: {
		default: '#fe4e54e4',
		[SUPPORTS_OKLCH]: 'oklch(71.50519091% 0.22752106 23.08329281 / 0.82)',
	},
	s10: {
		default: '#ff6465eb',
		[SUPPORTS_OKLCH]: 'oklch(74.07170402% 0.20192708 22.97110965 / 0.853)',
	},
	s11: {
		default: '#ff9592',
		[SUPPORTS_OKLCH]: 'oklch(78.36585751% 0.16185153 22.28845165)',
	},
	s12: {
		default: '#ffd1d9',
		[SUPPORTS_OKLCH]: 'oklch(90.21540109% 0.05283186 6.13932602)',
	},
})

export const violetLight = stylex.defineVars({
	s1: {
		default: '#fdfcfe',
		[SUPPORTS_OKLCH]: 'oklch(99.23880843% 0.00282733 308.42920717)',
	},
	s2: {
		default: '#faf8ff',
		[SUPPORTS_OKLCH]: 'oklch(98.264049% 0.00946806 299.24453878)',
	},
	s3: {
		default: '#f4f0fe',
		[SUPPORTS_OKLCH]: 'oklch(96.22754609% 0.01905585 299.07028344)',
	},
	s4: {
		default: '#ebe4ff',
		[SUPPORTS_OKLCH]: 'oklch(93.24720005% 0.03695075 297.53721484)',
	},
	s5: {
		default: '#e1d9ff',
		[SUPPORTS_OKLCH]: 'oklch(90.35118798% 0.05215935 294.9854694)',
	},
	s6: {
		default: '#d4cafe',
		[SUPPORTS_OKLCH]: 'oklch(86.41806848% 0.0720756 293.65207795)',
	},
	s7: {
		default: '#c2b5f5',
		[SUPPORTS_OKLCH]: 'oklch(80.62265888% 0.09022976 293.58911656)',
	},
	s8: {
		default: '#aa99ec',
		[SUPPORTS_OKLCH]: 'oklch(72.97289135% 0.11928947 292.59537262)',
	},
	s9: {
		default: '#6e56cf',
		[SUPPORTS_OKLCH]: 'oklch(54.16800366% 0.17902752 288.03321458)',
	},
	s10: {
		default: '#654dc4',
		[SUPPORTS_OKLCH]: 'oklch(51.08815883% 0.177459 287.68410648)',
	},
	s11: {
		default: '#6550b9',
		[SUPPORTS_OKLCH]: 'oklch(50.7831902% 0.15891791 288.63724309)',
	},
	s12: {
		default: '#2f265f',
		[SUPPORTS_OKLCH]: 'oklch(31.2809341% 0.09748632 286.56541743)',
	},
})

export const violetDark = stylex.defineVars({
	s1: {
		default: '#14121f',
		[SUPPORTS_OKLCH]: 'oklch(19.13586057% 0.02613174 290.76447612)',
	},
	s2: {
		default: '#1b1525',
		[SUPPORTS_OKLCH]: 'oklch(21.11332426% 0.03204688 300.93156643)',
	},
	s3: {
		default: '#291f43',
		[SUPPORTS_OKLCH]: 'oklch(27.07343332% 0.06548197 294.41367831)',
	},
	s4: {
		default: '#33255b',
		[SUPPORTS_OKLCH]: 'oklch(31.17973613% 0.09295173 292.0808153)',
	},
	s5: {
		default: '#3c2e69',
		[SUPPORTS_OKLCH]: 'oklch(34.91814103% 0.09913111 291.33349758)',
	},
	s6: {
		default: '#473876',
		[SUPPORTS_OKLCH]: 'oklch(38.89106295% 0.10212635 292.11515319)',
	},
	s7: {
		default: '#56468b',
		[SUPPORTS_OKLCH]: 'oklch(44.45278712% 0.11033863 291.96797765)',
	},
	s8: {
		default: '#6958ad',
		[SUPPORTS_OKLCH]: 'oklch(51.77389452% 0.13054116 290.2866582)',
	},
	s9: {
		default: '#6e56cf',
		[SUPPORTS_OKLCH]: 'oklch(54.16800366% 0.17902752 288.03321458)',
	},
	s10: {
		default: '#7d66d9',
		[SUPPORTS_OKLCH]: 'oklch(58.86228849% 0.16922052 289.35406371)',
	},
	s11: {
		default: '#baa7ff',
		[SUPPORTS_OKLCH]: 'oklch(77.78318029% 0.12462457 293.19424711)',
	},
	s12: {
		default: '#e2ddfe',
		[SUPPORTS_OKLCH]: 'oklch(91.16513249% 0.04495488 292.43640942)',
	},
})

export const violetAlphaLight = stylex.defineVars({
	s1: {
		default: '#5500aa03',
		[SUPPORTS_OKLCH]: 'oklch(39.37349603% 0.2164332 294.83169522 / 0.012)',
	},
	s2: {
		default: '#4900ff07',
		[SUPPORTS_OKLCH]: 'oklch(47.9853543% 0.2983925 276.34429119 / 0.027)',
	},
	s3: {
		default: '#4400ee0f',
		[SUPPORTS_OKLCH]: 'oklch(45.57976713% 0.28309598 276.49776996 / 0.059)',
	},
	s4: {
		default: '#4300ff1b',
		[SUPPORTS_OKLCH]: 'oklch(47.57607036% 0.29980642 274.66237251 / 0.106)',
	},
	s5: {
		default: '#3600ff26',
		[SUPPORTS_OKLCH]: 'oklch(46.80033385% 0.30312057 271.35672692 / 0.149)',
	},
	s6: {
		default: '#3100fb35',
		[SUPPORTS_OKLCH]: 'oklch(46.03562289% 0.30055166 270.43641959 / 0.208)',
	},
	s7: {
		default: '#2d01dd4a',
		[SUPPORTS_OKLCH]: 'oklch(42.02062962% 0.27191756 271.24108963 / 0.29)',
	},
	s8: {
		default: '#2b00d066',
		[SUPPORTS_OKLCH]: 'oklch(40.18600117% 0.25971816 271.60952394 / 0.4)',
	},
	s9: {
		default: '#2400b7a9',
		[SUPPORTS_OKLCH]: 'oklch(36.48985898% 0.23620733 271.42263953 / 0.663)',
	},
	s10: {
		default: '#2300abb2',
		[SUPPORTS_OKLCH]: 'oklch(34.82285592% 0.22405211 272.13670769 / 0.698)',
	},
	s11: {
		default: '#1f0099af',
		[SUPPORTS_OKLCH]: 'oklch(32.13371627% 0.2062189 272.44235785 / 0.686)',
	},
	s12: {
		default: '#0b0043d9',
		[SUPPORTS_OKLCH]: 'oklch(18.26841959% 0.11459872 275.23123493 / 0.851)',
	},
})

export const violetAlphaDark = stylex.defineVars({
	s1: {
		default: '#4422ff0f',
		[SUPPORTS_OKLCH]: 'oklch(49.11881707% 0.28916975 274.36973501 / 0.059)',
	},
	s2: {
		default: '#853ff916',
		[SUPPORTS_OKLCH]: 'oklch(56.5993737% 0.25458921 293.68665246 / 0.086)',
	},
	s3: {
		default: '#8354fe36',
		[SUPPORTS_OKLCH]: 'oklch(59.32186371% 0.23776372 289.87273726 / 0.212)',
	},
	s4: {
		default: '#7d51fd50',
		[SUPPORTS_OKLCH]: 'oklch(58.30194521% 0.24019837 288.34742442 / 0.314)',
	},
	s5: {
		default: '#845ffd5f',
		[SUPPORTS_OKLCH]: 'oklch(60.87791889% 0.22346243 288.74313121 / 0.373)',
	},
	s6: {
		default: '#8f6cfd6d',
		[SUPPORTS_OKLCH]: 'oklch(63.82011753% 0.20651302 290.45035676 / 0.427)',
	},
	s7: {
		default: '#9879ff83',
		[SUPPORTS_OKLCH]: 'oklch(66.82792799% 0.19123319 290.9717945 / 0.514)',
	},
	s8: {
		default: '#977dfea8',
		[SUPPORTS_OKLCH]: 'oklch(67.34814218% 0.18434446 289.80287907 / 0.659)',
	},
	s9: {
		default: '#8668ffcc',
		[SUPPORTS_OKLCH]: 'oklch(62.55807994% 0.2144688 287.67177782 / 0.8)',
	},
	s10: {
		default: '#9176fed7',
		[SUPPORTS_OKLCH]: 'oklch(65.66991726% 0.19418812 289.05301894 / 0.843)',
	},
	s11: {
		default: '#baa7ff',
		[SUPPORTS_OKLCH]: 'oklch(77.78318029% 0.12462457 293.19424711)',
	},
	s12: {
		default: '#e3defffe',
		[SUPPORTS_OKLCH]: 'oklch(91.46899034% 0.04491681 292.44039844 / 0.996)',
	},
})

export const irisLight = stylex.defineVars({
	s1: {
		default: '#fdfdff',
		[SUPPORTS_OKLCH]: 'oklch(99.4607663% 0.00263436 286.35185256)',
	},
	s2: {
		default: '#f8f8ff',
		[SUPPORTS_OKLCH]: 'oklch(98.11187577% 0.00926791 286.22766149)',
	},
	s3: {
		default: '#f0f1fe',
		[SUPPORTS_OKLCH]: 'oklch(96.11593116% 0.0173907 282.54413404)',
	},
	s4: {
		default: '#e6e7ff',
		[SUPPORTS_OKLCH]: 'oklch(93.44297597% 0.03238037 283.85212946)',
	},
	s5: {
		default: '#dadcff',
		[SUPPORTS_OKLCH]: 'oklch(90.39221895% 0.04779399 282.80730201)',
	},
	s6: {
		default: '#cbcdff',
		[SUPPORTS_OKLCH]: 'oklch(86.336665% 0.06918333 283.04795889)',
	},
	s7: {
		default: '#b8baf8',
		[SUPPORTS_OKLCH]: 'oklch(80.92350318% 0.08724109 282.82617029)',
	},
	s8: {
		default: '#9b9ef0',
		[SUPPORTS_OKLCH]: 'oklch(72.9280804% 0.11824556 281.43669088)',
	},
	s9: {
		default: '#5b5bd6',
		[SUPPORTS_OKLCH]: 'oklch(54.03101225% 0.18412416 278.28457641)',
	},
	s10: {
		default: '#5151cd',
		[SUPPORTS_OKLCH]: 'oklch(50.87469189% 0.18690672 277.44650246)',
	},
	s11: {
		default: '#5753c6',
		[SUPPORTS_OKLCH]: 'oklch(51.1107742% 0.17387713 279.84311181)',
	},
	s12: {
		default: '#272962',
		[SUPPORTS_OKLCH]: 'oklch(31.42751963% 0.0988414 277.56060901)',
	},
})

export const irisDark = stylex.defineVars({
	s1: {
		default: '#13131e',
		[SUPPORTS_OKLCH]: 'oklch(19.23608041% 0.02212742 284.12735027)',
	},
	s2: {
		default: '#171625',
		[SUPPORTS_OKLCH]: 'oklch(20.91079177% 0.02945457 286.60621582)',
	},
	s3: {
		default: '#202248',
		[SUPPORTS_OKLCH]: 'oklch(27.21898496% 0.06935396 278.45715866)',
	},
	s4: {
		default: '#262a65',
		[SUPPORTS_OKLCH]: 'oklch(31.80973103% 0.10227093 275.99367296)',
	},
	s5: {
		default: '#303374',
		[SUPPORTS_OKLCH]: 'oklch(35.68278919% 0.1095495 277.30687275)',
	},
	s6: {
		default: '#3d3e82',
		[SUPPORTS_OKLCH]: 'oklch(40.03542364% 0.11167083 279.45074801)',
	},
	s7: {
		default: '#4a4a95',
		[SUPPORTS_OKLCH]: 'oklch(44.84783403% 0.11985126 280.42284279)',
	},
	s8: {
		default: '#5958b1',
		[SUPPORTS_OKLCH]: 'oklch(50.68471882% 0.13766165 280.80433859)',
	},
	s9: {
		default: '#5b5bd6',
		[SUPPORTS_OKLCH]: 'oklch(54.03101225% 0.18412416 278.28457641)',
	},
	s10: {
		default: '#6e6ade',
		[SUPPORTS_OKLCH]: 'oklch(58.67976735% 0.1717363 281.25826681)',
	},
	s11: {
		default: '#b1a9ff',
		[SUPPORTS_OKLCH]: 'oklch(77.4294486% 0.12152308 287.46354763)',
	},
	s12: {
		default: '#e0dffe',
		[SUPPORTS_OKLCH]: 'oklch(91.3982253% 0.04204232 287.01607638)',
	},
})

export const irisAlphaLight = stylex.defineVars({
	s1: {
		default: '#0000ff02',
		[SUPPORTS_OKLCH]: 'oklch(45.20137184% 0.31321437 264.05202064 / 0.008)',
	},
	s2: {
		default: '#0000ff07',
		[SUPPORTS_OKLCH]: 'oklch(45.20137184% 0.31321437 264.05202064 / 0.027)',
	},
	s3: {
		default: '#0011ee0f',
		[SUPPORTS_OKLCH]: 'oklch(43.55591468% 0.29281721 264.14711231 / 0.059)',
	},
	s4: {
		default: '#000bff19',
		[SUPPORTS_OKLCH]: 'oklch(45.55603571% 0.31079337 264.10661062 / 0.098)',
	},
	s5: {
		default: '#000eff25',
		[SUPPORTS_OKLCH]: 'oklch(45.66560715% 0.31004696 264.12103157 / 0.145)',
	},
	s6: {
		default: '#000aff34',
		[SUPPORTS_OKLCH]: 'oklch(45.52328961% 0.31101658 264.10207856 / 0.204)',
	},
	s7: {
		default: '#0008e647',
		[SUPPORTS_OKLCH]: 'oklch(42.10954073% 0.28764937 264.10256981 / 0.278)',
	},
	s8: {
		default: '#0008d964',
		[SUPPORTS_OKLCH]: 'oklch(40.34523281% 0.27505003 264.10879804 / 0.392)',
	},
	s9: {
		default: '#0000c0a4',
		[SUPPORTS_OKLCH]: 'oklch(36.51349812% 0.25301339 264.05202064 / 0.643)',
	},
	s10: {
		default: '#0000b6ae',
		[SUPPORTS_OKLCH]: 'oklch(35.08865114% 0.24314018 264.05202064 / 0.682)',
	},
	s11: {
		default: '#0600abac',
		[SUPPORTS_OKLCH]: 'oklch(33.65482949% 0.23100038 265.01551791 / 0.675)',
	},
	s12: {
		default: '#000246d8',
		[SUPPORTS_OKLCH]: 'oklch(18.22508256% 0.12068768 264.1778709 / 0.847)',
	},
})

export const irisAlphaDark = stylex.defineVars({
	s1: {
		default: '#3636fe0e',
		[SUPPORTS_OKLCH]: 'oklch(50.08473063% 0.2789077 270.36637282 / 0.055)',
	},
	s2: {
		default: '#564bf916',
		[SUPPORTS_OKLCH]: 'oklch(54.07762087% 0.24716272 277.00167258 / 0.086)',
	},
	s3: {
		default: '#525bff3b',
		[SUPPORTS_OKLCH]: 'oklch(56.77038467% 0.23837229 273.49814081 / 0.231)',
	},
	s4: {
		default: '#4d58ff5a',
		[SUPPORTS_OKLCH]: 'oklch(56.01256228% 0.24284538 272.63753781 / 0.353)',
	},
	s5: {
		default: '#5b62fd6b',
		[SUPPORTS_OKLCH]: 'oklch(58.28211345% 0.2258805 274.92278318 / 0.42)',
	},
	s6: {
		default: '#6d6ffd7a',
		[SUPPORTS_OKLCH]: 'oklch(61.65929608% 0.20638529 277.86021154 / 0.478)',
	},
	s7: {
		default: '#7777fe8e',
		[SUPPORTS_OKLCH]: 'oklch(63.82215235% 0.19568 279.30967725 / 0.557)',
	},
	s8: {
		default: '#7b7afeac',
		[SUPPORTS_OKLCH]: 'oklch(64.63762844% 0.19110244 279.96226346 / 0.675)',
	},
	s9: {
		default: '#6a6afed4',
		[SUPPORTS_OKLCH]: 'oklch(60.67265257% 0.21440843 277.89187459 / 0.831)',
	},
	s10: {
		default: '#7d79ffdc',
		[SUPPORTS_OKLCH]: 'oklch(64.67153946% 0.19338286 280.86394575 / 0.863)',
	},
	s11: {
		default: '#b1a9ff',
		[SUPPORTS_OKLCH]: 'oklch(77.4294486% 0.12152308 287.46354763)',
	},
	s12: {
		default: '#e1e0fffe',
		[SUPPORTS_OKLCH]: 'oklch(91.7019271% 0.04200646 287.0198254 / 0.996)',
	},
})

export const blueLight = stylex.defineVars({
	s1: {
		default: '#fbfdff',
		[SUPPORTS_OKLCH]: 'oklch(99.31941836% 0.00328727 247.6433294)',
	},
	s2: {
		default: '#f4faff',
		[SUPPORTS_OKLCH]: 'oklch(98.15037594% 0.00954998 243.257732)',
	},
	s3: {
		default: '#e6f4fe',
		[SUPPORTS_OKLCH]: 'oklch(96.00298116% 0.01987251 236.71258935)',
	},
	s4: {
		default: '#d5efff',
		[SUPPORTS_OKLCH]: 'oklch(93.73452831% 0.03707149 239.02661074)',
	},
	s5: {
		default: '#c2e5ff',
		[SUPPORTS_OKLCH]: 'oklch(90.60061227% 0.05347593 242.80318064)',
	},
	s6: {
		default: '#acd8fc',
		[SUPPORTS_OKLCH]: 'oklch(86.38402383% 0.06858653 243.1816451)',
	},
	s7: {
		default: '#8ec8f6',
		[SUPPORTS_OKLCH]: 'oklch(80.91816432% 0.08841271 243.33955252)',
	},
	s8: {
		default: '#5eb1ef',
		[SUPPORTS_OKLCH]: 'oklch(73.48373747% 0.12110103 242.99517972)',
	},
	s9: {
		default: '#0090ff',
		[SUPPORTS_OKLCH]: 'oklch(64.9324951% 0.19303675 251.81320332)',
	},
	s10: {
		default: '#0588f0',
		[SUPPORTS_OKLCH]: 'oklch(62.11258889% 0.18372952 251.91748458)',
	},
	s11: {
		default: '#0d74ce',
		[SUPPORTS_OKLCH]: 'oklch(55.77424368% 0.18889655 253.00973175)',
	},
	s12: {
		default: '#113264',
		[SUPPORTS_OKLCH]: 'oklch(32.39696643% 0.09650182 258.95556478)',
	},
})

export const blueDark = stylex.defineVars({
	s1: {
		default: '#0d1520',
		[SUPPORTS_OKLCH]: 'oklch(19.31755191% 0.02579191 256.78958305)',
	},
	s2: {
		default: '#111927',
		[SUPPORTS_OKLCH]: 'oklch(21.29931223% 0.02951006 258.83745075)',
	},
	s3: {
		default: '#0d2847',
		[SUPPORTS_OKLCH]: 'oklch(27.41187948% 0.06687609 253.96229215)',
	},
	s4: {
		default: '#003362',
		[SUPPORTS_OKLCH]: 'oklch(31.69684992% 0.10018575 248.29961215)',
	},
	s5: {
		default: '#004074',
		[SUPPORTS_OKLCH]: 'oklch(36.48503151% 0.10839414 249.72394025)',
	},
	s6: {
		default: '#104d87',
		[SUPPORTS_OKLCH]: 'oklch(41.60552828% 0.1124629 251.66038856)',
	},
	s7: {
		default: '#205d9e',
		[SUPPORTS_OKLCH]: 'oklch(47.48411723% 0.12111213 252.83865983)',
	},
	s8: {
		default: '#2870bd',
		[SUPPORTS_OKLCH]: 'oklch(54.12869945% 0.13958612 253.21135272)',
	},
	s9: {
		default: '#0090ff',
		[SUPPORTS_OKLCH]: 'oklch(64.9324951% 0.19303675 251.81320332)',
	},
	s10: {
		default: '#3b9eff',
		[SUPPORTS_OKLCH]: 'oklch(68.90080158% 0.16967463 251.45654826)',
	},
	s11: {
		default: '#70b8ff',
		[SUPPORTS_OKLCH]: 'oklch(76.78697071% 0.13471123 248.84393318)',
	},
	s12: {
		default: '#c2e6ff',
		[SUPPORTS_OKLCH]: 'oklch(90.7212219% 0.05114599 238.27338401)',
	},
})

export const blueAlphaLight = stylex.defineVars({
	s1: {
		default: '#0080ff04',
		[SUPPORTS_OKLCH]: 'oklch(62.20417474% 0.22750504 250.43732176 / 0.016)',
	},
	s2: {
		default: '#008cff0b',
		[SUPPORTS_OKLCH]: 'oklch(60.39730533% 0.19871911 245.81236558 / 0.04)',
	},
	s3: {
		default: '#008ff519',
		[SUPPORTS_OKLCH]: 'oklch(60.09609144% 0.2033682 246.90861369 / 0.087)',
	},
	s4: {
		default: '#009eff2a',
		[SUPPORTS_OKLCH]: 'oklch(63.75445742% 0.22038515 247.77168835 / 0.146)',
	},
	s5: {
		default: '#0093ff3d',
		[SUPPORTS_OKLCH]: 'oklch(61.23865678% 0.22609605 250.48153221 / 0.212)',
	},
	s6: {
		default: '#0088f653',
		[SUPPORTS_OKLCH]: 'oklch(58.00517094% 0.21669022 250.95099935 / 0.291)',
	},
	s7: {
		default: '#0083eb71',
		[SUPPORTS_OKLCH]: 'oklch(55.15001304% 0.20632512 251.02009018 / 0.393)',
	},
	s8: {
		default: '#0084e6a1',
		[SUPPORTS_OKLCH]: 'oklch(54.68381311% 0.20368282 250.7572444 / 0.55)',
	},
	s9: {
		default: '#0090ff',
		[SUPPORTS_OKLCH]: 'oklch(56.35951096% 0.24246047 255.63495562 / 0.753)',
	},
	s10: {
		default: '#0086f0fa',
		[SUPPORTS_OKLCH]: 'oklch(52.93381666% 0.22844469 255.72754478 / 0.765)',
	},
	s11: {
		default: '#006dcbf2',
		[SUPPORTS_OKLCH]: 'oklch(55.77424368% 0.18889655 253.00973175)',
	},
	s12: {
		default: '#002359ee',
		[SUPPORTS_OKLCH]: 'oklch(32.39696643% 0.09650182 258.95556478)',
	},
})

export const blueAlphaDark = stylex.defineVars({
	s1: {
		default: '#004df211',
		[SUPPORTS_OKLCH]: 'oklch(53.925394% 0.27488081 259.84953368 / 0.059)',
	},
	s2: {
		default: '#1166fb18',
		[SUPPORTS_OKLCH]: 'oklch(58.41413667% 0.24079801 257.01210807 / 0.085)',
	},
	s3: {
		default: '#0077ff3a',
		[SUPPORTS_OKLCH]: 'oklch(60.02921401% 0.23678374 255.78215602 / 0.219)',
	},
	s4: {
		default: '#0075ff57',
		[SUPPORTS_OKLCH]: 'oklch(59.83501292% 0.24014363 253.45302467 / 0.324)',
	},
	s5: {
		default: '#0081fd6b',
		[SUPPORTS_OKLCH]: 'oklch(62.20727888% 0.22593569 251.84430811 / 0.4)',
	},
	s6: {
		default: '#0f89fd7f',
		[SUPPORTS_OKLCH]: 'oklch(65.33475544% 0.20513822 251.99366231 / 0.475)',
	},
	s7: {
		default: '#2a91fe98',
		[SUPPORTS_OKLCH]: 'oklch(67.35393141% 0.19118924 252.93863928 / 0.572)',
	},
	s8: {
		default: '#3094feb9',
		[SUPPORTS_OKLCH]: 'oklch(67.97372394% 0.18691275 253.30107715 / 0.702)',
	},
	s9: {
		default: '#0090ff',
		[SUPPORTS_OKLCH]: 'oklch(66.30768115% 0.19731755 251.51273108 / 0.967)',
	},
	s10: {
		default: '#3b9eff',
		[SUPPORTS_OKLCH]: 'oklch(70.45052472% 0.1725664 251.44368612 / 0.971)',
	},
	s11: {
		default: '#70b8ff',
		[SUPPORTS_OKLCH]: 'oklch(76.78697071% 0.13471123 248.84393318)',
	},
	s12: {
		default: '#c2e6ff',
		[SUPPORTS_OKLCH]: 'oklch(90.7212219% 0.05114599 238.27338401)',
	},
})

export const greenLight = stylex.defineVars({
	s1: {
		default: '#fbfefc',
		[SUPPORTS_OKLCH]: 'oklch(99.42850532% 0.00430862 159.05483652)',
	},
	s2: {
		default: '#f4fbf6',
		[SUPPORTS_OKLCH]: 'oklch(98.15779007% 0.00911326 155.30772524)',
	},
	s3: {
		default: '#e6f6eb',
		[SUPPORTS_OKLCH]: 'oklch(95.88042956% 0.02292766 156.37932035)',
	},
	s4: {
		default: '#d6f1df',
		[SUPPORTS_OKLCH]: 'oklch(93.25499734% 0.036406 156.60090444)',
	},
	s5: {
		default: '#c4e8d1',
		[SUPPORTS_OKLCH]: 'oklch(89.95154423% 0.04963049 157.2228047)',
	},
	s6: {
		default: '#adddc0',
		[SUPPORTS_OKLCH]: 'oklch(85.700083% 0.06450174 157.88573052)',
	},
	s7: {
		default: '#8eceaa',
		[SUPPORTS_OKLCH]: 'oklch(79.77282094% 0.08388258 159.01914058)',
	},
	s8: {
		default: '#5bb98b',
		[SUPPORTS_OKLCH]: 'oklch(71.43565954% 0.11240044 160.59871816)',
	},
	s9: {
		default: '#30a46c',
		[SUPPORTS_OKLCH]: 'oklch(64.04878471% 0.13273937 157.75084139)',
	},
	s10: {
		default: '#2b9a66',
		[SUPPORTS_OKLCH]: 'oklch(61.1245499% 0.12631512 158.3069076)',
	},
	s11: {
		default: '#218358',
		[SUPPORTS_OKLCH]: 'oklch(52.90389499% 0.13303514 158.3319621)',
	},
	s12: {
		default: '#193b2d',
		[SUPPORTS_OKLCH]: 'oklch(32.17573191% 0.04741505 164.61591187)',
	},
})

export const greenDark = stylex.defineVars({
	s1: {
		default: '#0e1512',
		[SUPPORTS_OKLCH]: 'oklch(18.87818633% 0.01270815 163.26789614)',
	},
	s2: {
		default: '#121b17',
		[SUPPORTS_OKLCH]: 'oklch(21.2674261% 0.0160099 162.22492872)',
	},
	s3: {
		default: '#132d21',
		[SUPPORTS_OKLCH]: 'oklch(27.14139319% 0.03880835 162.66788594)',
	},
	s4: {
		default: '#113b29',
		[SUPPORTS_OKLCH]: 'oklch(31.82218507% 0.05730663 161.54387449)',
	},
	s5: {
		default: '#174933',
		[SUPPORTS_OKLCH]: 'oklch(36.48476336% 0.06599927 161.11283188)',
	},
	s6: {
		default: '#20573e',
		[SUPPORTS_OKLCH]: 'oklch(41.33512313% 0.07323247 160.73197338)',
	},
	s7: {
		default: '#28684a',
		[SUPPORTS_OKLCH]: 'oklch(46.7371153% 0.08283708 159.90823234)',
	},
	s8: {
		default: '#2f7c57',
		[SUPPORTS_OKLCH]: 'oklch(52.74623189% 0.09618442 159.19280486)',
	},
	s9: {
		default: '#30a46c',
		[SUPPORTS_OKLCH]: 'oklch(64.04878471% 0.13273937 157.75084139)',
	},
	s10: {
		default: '#33b074',
		[SUPPORTS_OKLCH]: 'oklch(67.55200471% 0.14122761 157.56019893)',
	},
	s11: {
		default: '#3dd68c',
		[SUPPORTS_OKLCH]: 'oklch(77.96802271% 0.16568634 157.23050052)',
	},
	s12: {
		default: '#b1f1cb',
		[SUPPORTS_OKLCH]: 'oklch(90.48084397% 0.0827555 158.27605021)',
	},
})

export const greenAlphaLight = stylex.defineVars({
	s1: {
		default: '#00c04004',
		[SUPPORTS_OKLCH]: 'oklch(69.28230923% 0.26441494 150.02487106 / 0.016)',
	},
	s2: {
		default: '#00a32f0b',
		[SUPPORTS_OKLCH]: 'oklch(55.69955894% 0.22526681 147.64688982 / 0.036)',
	},
	s3: {
		default: '#00a43319',
		[SUPPORTS_OKLCH]: 'oklch(57.89706272% 0.23364908 147.95923815 / 0.087)',
	},
	s4: {
		default: '#00a83829',
		[SUPPORTS_OKLCH]: 'oklch(57.32413405% 0.23105625 148.06240351 / 0.142)',
	},
	s5: {
		default: '#019c393b',
		[SUPPORTS_OKLCH]: 'oklch(54.00611469% 0.21225242 149.04802864 / 0.204)',
	},
	s6: {
		default: '#00963c52',
		[SUPPORTS_OKLCH]: 'oklch(52.35637771% 0.20387137 149.39182025 / 0.283)',
	},
	s7: {
		default: '#00914071',
		[SUPPORTS_OKLCH]: 'oklch(50.06772239% 0.19004922 150.37486821 / 0.389)',
	},
	s8: {
		default: '#00924ba4',
		[SUPPORTS_OKLCH]: 'oklch(49.60696556% 0.17820831 152.7955185 / 0.55)',
	},
	s9: {
		default: '#008f4acf',
		[SUPPORTS_OKLCH]: 'oklch(47.79200623% 0.17834957 151.17403415 / 0.667)',
	},
	s10: {
		default: '#008647d4',
		[SUPPORTS_OKLCH]: 'oklch(44.86349695% 0.16609234 151.50466732 / 0.691)',
	},
	s11: {
		default: '#00713fde',
		[SUPPORTS_OKLCH]: 'oklch(52.90389499% 0.13303514 158.3319621)',
	},
	s12: {
		default: '#002616e6',
		[SUPPORTS_OKLCH]: 'oklch(32.17573191% 0.04741505 164.61591187)',
	},
})

export const greenAlphaDark = stylex.defineVars({
	s1: {
		default: '#00de4505',
		[SUPPORTS_OKLCH]: 'oklch(84.70040198% 0.33703291 148.66563661 / 0.017)',
	},
	s2: {
		default: '#29f99d0b',
		[SUPPORTS_OKLCH]: 'oklch(86.4353437% 0.23543921 157.90363088 / 0.043)',
	},
	s3: {
		default: '#22ff991e',
		[SUPPORTS_OKLCH]: 'oklch(87.88816929% 0.22702289 159.12166443 / 0.114)',
	},
	s4: {
		default: '#11ff992d',
		[SUPPORTS_OKLCH]: 'oklch(87.50399388% 0.23706745 158.56392475 / 0.173)',
	},
	s5: {
		default: '#2bffa23c',
		[SUPPORTS_OKLCH]: 'oklch(88.53259214% 0.21790878 159.80360649 / 0.232)',
	},
	s6: {
		default: '#44ffaa4b',
		[SUPPORTS_OKLCH]: 'oklch(89.35217051% 0.19915014 160.01516837 / 0.29)',
	},
	s7: {
		default: '#50fdac5e',
		[SUPPORTS_OKLCH]: 'oklch(89.7826628% 0.19147907 158.66976019 / 0.362)',
	},
	s8: {
		default: '#54ffad73',
		[SUPPORTS_OKLCH]: 'oklch(90.03077486% 0.18546746 159.09056067 / 0.442)',
	},
	s9: {
		default: '#44ffa49e',
		[SUPPORTS_OKLCH]: 'oklch(89.27310824% 0.1981152 157.37756283 / 0.61)',
	},
	s10: {
		default: '#43fea4ab',
		[SUPPORTS_OKLCH]: 'oklch(89.54989944% 0.19905407 157.09813282 / 0.66)',
	},
	s11: {
		default: '#46fea5d4',
		[SUPPORTS_OKLCH]: 'oklch(77.96802271% 0.16568634 157.23050052)',
	},
	s12: {
		default: '#bbffd7f0',
		[SUPPORTS_OKLCH]: 'oklch(90.48084397% 0.0827555 158.27605021)',
	},
})

export const amberLight = stylex.defineVars({
	s1: {
		default: '#fefdfb',
		[SUPPORTS_OKLCH]: 'oklch(99.4030704% 0.00276872 84.6245488)',
	},
	s2: {
		default: '#fefbe9',
		[SUPPORTS_OKLCH]: 'oklch(98.62334424% 0.02404235 100.25758591)',
	},
	s3: {
		default: '#fff7c2',
		[SUPPORTS_OKLCH]: 'oklch(96.90287605% 0.0685841 100.35993073)',
	},
	s4: {
		default: '#ffee9c',
		[SUPPORTS_OKLCH]: 'oklch(94.53500645% 0.1042519 98.19183247)',
	},
	s5: {
		default: '#fbe577',
		[SUPPORTS_OKLCH]: 'oklch(91.84491438% 0.13328511 98.3956354)',
	},
	s6: {
		default: '#f3d673',
		[SUPPORTS_OKLCH]: 'oklch(88.11963591% 0.12369166 93.23756498)',
	},
	s7: {
		default: '#e9c162',
		[SUPPORTS_OKLCH]: 'oklch(82.73633145% 0.12199714 86.17540664)',
	},
	s8: {
		default: '#e2a336',
		[SUPPORTS_OKLCH]: 'oklch(75.81955414% 0.14038608 76.70110073)',
	},
	s9: {
		default: '#ffc53d',
		[SUPPORTS_OKLCH]: 'oklch(85.62297342% 0.17783788 81.37024597)',
	},
	s10: {
		default: '#ffba18',
		[SUPPORTS_OKLCH]: 'oklch(83.14551159% 0.1678987 80.93775503)',
	},
	s11: {
		default: '#ab6400',
		[SUPPORTS_OKLCH]: 'oklch(56.92072102% 0.14389436 67.2809041)',
	},
	s12: {
		default: '#4f3422',
		[SUPPORTS_OKLCH]: 'oklch(35.19009114% 0.04852155 53.73708034)',
	},
})

export const amberDark = stylex.defineVars({
	s1: {
		default: '#16120c',
		[SUPPORTS_OKLCH]: 'oklch(18.35643237% 0.01264678 77.26751706)',
	},
	s2: {
		default: '#1d180f',
		[SUPPORTS_OKLCH]: 'oklch(21.16838317% 0.01794677 78.67613275)',
	},
	s3: {
		default: '#302008',
		[SUPPORTS_OKLCH]: 'oklch(25.75065409% 0.04372631 74.55813532)',
	},
	s4: {
		default: '#3f2700',
		[SUPPORTS_OKLCH]: 'oklch(29.62106998% 0.07146227 76.24754777)',
	},
	s5: {
		default: '#4d3000',
		[SUPPORTS_OKLCH]: 'oklch(33.68679115% 0.08122085 76.41336897)',
	},
	s6: {
		default: '#5c3d05',
		[SUPPORTS_OKLCH]: 'oklch(38.70683627% 0.07844236 75.09143812)',
	},
	s7: {
		default: '#714f19',
		[SUPPORTS_OKLCH]: 'oklch(45.31735184% 0.08172995 74.54889888)',
	},
	s8: {
		default: '#8f6424',
		[SUPPORTS_OKLCH]: 'oklch(53.60307021% 0.09641 73.57430782)',
	},
	s9: {
		default: '#ffc53d',
		[SUPPORTS_OKLCH]: 'oklch(85.62297342% 0.17783788 81.37024597)',
	},
	s10: {
		default: '#ffd60a',
		[SUPPORTS_OKLCH]: 'oklch(90.1529537% 0.2064918 96.98217551)',
	},
	s11: {
		default: '#ffca16',
		[SUPPORTS_OKLCH]: 'oklch(87.06117955% 0.17536486 85.06779329)',
	},
	s12: {
		default: '#ffe7b3',
		[SUPPORTS_OKLCH]: 'oklch(93.49339627% 0.07153262 85.98932967)',
	},
})

export const amberAlphaLight = stylex.defineVars({
	s1: {
		default: '#c0800004',
		[SUPPORTS_OKLCH]: 'oklch(66.15084713% 0.15990267 73.44458796 / 0.016)',
	},
	s2: {
		default: '#f4d10016',
		[SUPPORTS_OKLCH]: 'oklch(84.29868809% 0.20265454 100.03837561 / 0.079)',
	},
	s3: {
		default: '#ffde003d',
		[SUPPORTS_OKLCH]: 'oklch(88.63231781% 0.21314069 99.87867825 / 0.22)',
	},
	s4: {
		default: '#ffd40063',
		[SUPPORTS_OKLCH]: 'oklch(86.84971544% 0.20601997 94.93456007 / 0.35)',
	},
	s5: {
		default: '#f8cf0088',
		[SUPPORTS_OKLCH]: 'oklch(84.72547164% 0.20132906 95.77748183 / 0.475)',
	},
	s6: {
		default: '#eab5008c',
		[SUPPORTS_OKLCH]: 'oklch(77.63644391% 0.18299716 86.79747526 / 0.495)',
	},
	s7: {
		default: '#dc9b009d',
		[SUPPORTS_OKLCH]: 'oklch(70.37044743% 0.16865008 78.17190299 / 0.557)',
	},
	s8: {
		default: '#da8a00c9',
		[SUPPORTS_OKLCH]: 'oklch(66.6493436% 0.16755312 68.12744474 / 0.699)',
	},
	s9: {
		default: '#ffb300c2',
		[SUPPORTS_OKLCH]: 'oklch(81.6194956% 0.19869667 74.04649479 / 0.742)',
	},
	s10: {
		default: '#ffb300e7',
		[SUPPORTS_OKLCH]: 'oklch(78.0063924% 0.19044404 73.41961741 / 0.726)',
	},
	s11: {
		default: '#ab6400',
		[SUPPORTS_OKLCH]: 'oklch(56.92072102% 0.14389436 67.2809041)',
	},
	s12: {
		default: '#341500dd',
		[SUPPORTS_OKLCH]: 'oklch(35.19009114% 0.04852155 53.73708034)',
	},
})

export const amberAlphaDark = stylex.defineVars({
	s1: {
		default: '#e63c0006',
		[SUPPORTS_OKLCH]: 'oklch(67.99587816% 0.26138689 36.13155529 / 0.017)',
	},
	s2: {
		default: '#fd9b000d',
		[SUPPORTS_OKLCH]: 'oklch(79.73485259% 0.19770944 70.40690615 / 0.047)',
	},
	s3: {
		default: '#fa820022',
		[SUPPORTS_OKLCH]: 'oklch(78.02930666% 0.20424521 62.66469235 / 0.118)',
	},
	s4: {
		default: '#fc820032',
		[SUPPORTS_OKLCH]: 'oklch(76.34690964% 0.20992745 57.42247053 / 0.185)',
	},
	s5: {
		default: '#fd8b0041',
		[SUPPORTS_OKLCH]: 'oklch(77.71016062% 0.20516919 61.65999659 / 0.24)',
	},
	s6: {
		default: '#fd9b0051',
		[SUPPORTS_OKLCH]: 'oklch(80.51078957% 0.19557215 69.33079212 / 0.299)',
	},
	s7: {
		default: '#ffab2567',
		[SUPPORTS_OKLCH]: 'oklch(83.12352839% 0.17526308 72.40059747 / 0.383)',
	},
	s8: {
		default: '#ffae3587',
		[SUPPORTS_OKLCH]: 'oklch(83.76343948% 0.16723 73.29723004 / 0.5)',
	},
	s9: {
		default: '#ffc53d',
		[SUPPORTS_OKLCH]: 'oklch(85.57550339% 0.17792948 81.24756275)',
	},
	s10: {
		default: '#ffd60a',
		[SUPPORTS_OKLCH]: 'oklch(90.20006091% 0.20677993 97.10812948)',
	},
	s11: {
		default: '#ffca16',
		[SUPPORTS_OKLCH]: 'oklch(87.06117955% 0.17536486 85.06779329)',
	},
	s12: {
		default: '#ffe7b3',
		[SUPPORTS_OKLCH]: 'oklch(93.49339627% 0.07153262 85.98932967)',
	},
})

export const orangeLight = stylex.defineVars({
	s1: {
		default: '#fefcfb',
		[SUPPORTS_OKLCH]: 'oklch(99.21648407% 0.00263795 40.72838928)',
	},
	s2: {
		default: '#fff7ed',
		[SUPPORTS_OKLCH]: 'oklch(97.87479519% 0.01536142 70.82638516)',
	},
	s3: {
		default: '#ffefd6',
		[SUPPORTS_OKLCH]: 'oklch(95.76040457% 0.03682342 78.1146809)',
	},
	s4: {
		default: '#ffdfb5',
		[SUPPORTS_OKLCH]: 'oklch(92.02557572% 0.08106999 74.15552395)',
	},
	s5: {
		default: '#ffd19a',
		[SUPPORTS_OKLCH]: 'oklch(89.04274158% 0.10655122 70.83590795)',
	},
	s6: {
		default: '#ffc182',
		[SUPPORTS_OKLCH]: 'oklch(85.72758006% 0.10995792 64.42668942)',
	},
	s7: {
		default: '#f5ae73',
		[SUPPORTS_OKLCH]: 'oklch(80.52550431% 0.11257117 59.88158496)',
	},
	s8: {
		default: '#ec9455',
		[SUPPORTS_OKLCH]: 'oklch(74.5380447% 0.13211425 54.81920556)',
	},
	s9: {
		default: '#f76b15',
		[SUPPORTS_OKLCH]: 'oklch(68.90227247% 0.19108453 44.80216499)',
	},
	s10: {
		default: '#ef5f00',
		[SUPPORTS_OKLCH]: 'oklch(66.21587632% 0.19444164 43.48640867)',
	},
	s11: {
		default: '#cc4e00',
		[SUPPORTS_OKLCH]: 'oklch(59.18650375% 0.18602279 46.95420372)',
	},
	s12: {
		default: '#582d1d',
		[SUPPORTS_OKLCH]: 'oklch(35.01176392% 0.06868043 40.82265552)',
	},
})

export const orangeDark = stylex.defineVars({
	s1: {
		default: '#17120e',
		[SUPPORTS_OKLCH]: 'oklch(18.64301216% 0.01190712 53.74717446)',
	},
	s2: {
		default: '#1e160f',
		[SUPPORTS_OKLCH]: 'oklch(20.88263488% 0.01918014 67.38143789)',
	},
	s3: {
		default: '#331e0b',
		[SUPPORTS_OKLCH]: 'oklch(25.74510572% 0.04524913 59.5431688)',
	},
	s4: {
		default: '#462100',
		[SUPPORTS_OKLCH]: 'oklch(29.32861732% 0.07964386 58.64712084)',
	},
	s5: {
		default: '#562800',
		[SUPPORTS_OKLCH]: 'oklch(33.45531844% 0.08679914 58.089058)',
	},
	s6: {
		default: '#66350c',
		[SUPPORTS_OKLCH]: 'oklch(38.62855737% 0.08688648 55.15265593)',
	},
	s7: {
		default: '#7e451d',
		[SUPPORTS_OKLCH]: 'oklch(45.33508716% 0.09471802 53.05671672)',
	},
	s8: {
		default: '#a35829',
		[SUPPORTS_OKLCH]: 'oklch(54.0502961% 0.11617603 49.74821465)',
	},
	s9: {
		default: '#f76b15',
		[SUPPORTS_OKLCH]: 'oklch(68.90227247% 0.19108453 44.80216499)',
	},
	s10: {
		default: '#ff801f',
		[SUPPORTS_OKLCH]: 'oklch(74.13532802% 0.19910158 46.32273217)',
	},
	s11: {
		default: '#ffa057',
		[SUPPORTS_OKLCH]: 'oklch(79.89810577% 0.16312328 50.76600708)',
	},
	s12: {
		default: '#ffe0c2',
		[SUPPORTS_OKLCH]: 'oklch(92.48383921% 0.05240703 66.21996015)',
	},
})

export const orangeAlphaLight = stylex.defineVars({
	s1: {
		default: '#c0400004',
		[SUPPORTS_OKLCH]: 'oklch(56.76785998% 0.20152232 39.13339874 / 0.016)',
	},
	s2: {
		default: '#ff8e0012',
		[SUPPORTS_OKLCH]: 'oklch(71.3671254% 0.18565889 63.09085031 / 0.067)',
	},
	s3: {
		default: '#ff9c0029',
		[SUPPORTS_OKLCH]: 'oklch(74.72549225% 0.18870492 67.09972092 / 0.15)',
	},
	s4: {
		default: '#ff91014a',
		[SUPPORTS_OKLCH]: 'oklch(78.19162929% 0.20367896 63.12954181 / 0.314)',
	},
	s5: {
		default: '#ff8b0065',
		[SUPPORTS_OKLCH]: 'oklch(76.80990771% 0.20804864 58.79927075 / 0.416)',
	},
	s6: {
		default: '#ff81007d',
		[SUPPORTS_OKLCH]: 'oklch(72.12260992% 0.20723519 53.40898455 / 0.455)',
	},
	s7: {
		default: '#ed6c008c',
		[SUPPORTS_OKLCH]: 'oklch(64.77390489% 0.19400272 50.28807419 / 0.514)',
	},
	s8: {
		default: '#e35f00aa',
		[SUPPORTS_OKLCH]: 'oklch(61.31260005% 0.19677897 45.62058218 / 0.62)',
	},
	s9: {
		default: '#f65e00ea',
		[SUPPORTS_OKLCH]: 'oklch(63.39020033% 0.22620243 39.67405492 / 0.8)',
	},
	s10: {
		default: '#ef5f00',
		[SUPPORTS_OKLCH]: 'oklch(61.20202971% 0.22172977 38.91603439 / 0.836)',
	},
	s11: {
		default: '#cc4e00',
		[SUPPORTS_OKLCH]: 'oklch(59.18650375% 0.18602279 46.95420372)',
	},
	s12: {
		default: '#431200e2',
		[SUPPORTS_OKLCH]: 'oklch(35.01176392% 0.06868043 40.82265552)',
	},
})

export const orangeAlphaDark = stylex.defineVars({
	s1: {
		default: '#ec360007',
		[SUPPORTS_OKLCH]: 'oklch(65.51906332% 0.26336651 34.20225219 / 0.022)',
	},
	s2: {
		default: '#fe6d000e',
		[SUPPORTS_OKLCH]: 'oklch(75.00386588% 0.21242335 54.73426071 / 0.051)',
	},
	s3: {
		default: '#fb6a0025',
		[SUPPORTS_OKLCH]: 'oklch(73.60942382% 0.22146659 49.95752404 / 0.131)',
	},
	s4: {
		default: '#ff590039',
		[SUPPORTS_OKLCH]: 'oklch(70.37446706% 0.24356444 41.26651489 / 0.211)',
	},
	s5: {
		default: '#ff61004a',
		[SUPPORTS_OKLCH]: 'oklch(72.71765512% 0.22896823 46.83546435 / 0.265)',
	},
	s6: {
		default: '#fd75045c',
		[SUPPORTS_OKLCH]: 'oklch(75.38933972% 0.20925812 51.88447974 / 0.332)',
	},
	s7: {
		default: '#ff832c75',
		[SUPPORTS_OKLCH]: 'oklch(77.10683824% 0.1910206 51.34909837 / 0.429)',
	},
	s8: {
		default: '#fe84389d',
		[SUPPORTS_OKLCH]: 'oklch(77.81895319% 0.18214994 50.07409312 / 0.572)',
	},
	s9: {
		default: '#fe6d15f7',
		[SUPPORTS_OKLCH]: 'oklch(74.28221983% 0.2098385 44.43174503 / 0.895)',
	},
	s10: {
		default: '#ff801f',
		[SUPPORTS_OKLCH]: 'oklch(75.31712363% 0.20198972 46.4761531 / 0.979)',
	},
	s11: {
		default: '#ffa057',
		[SUPPORTS_OKLCH]: 'oklch(79.89810577% 0.16312328 50.76600708)',
	},
	s12: {
		default: '#ffe0c2',
		[SUPPORTS_OKLCH]: 'oklch(92.48383921% 0.05240703 66.21996015)',
	},
})

export const blackAlpha = stylex.defineVars({
	s1: {
		default: 'rgba(0, 0, 0, 0.05)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.05)',
	},
	s2: {
		default: 'rgba(0, 0, 0, 0.1)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.1)',
	},
	s3: {
		default: 'rgba(0, 0, 0, 0.15)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.15)',
	},
	s4: {
		default: 'rgba(0, 0, 0, 0.2)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.2)',
	},
	s5: {
		default: 'rgba(0, 0, 0, 0.3)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.3)',
	},
	s6: {
		default: 'rgba(0, 0, 0, 0.4)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.4)',
	},
	s7: {
		default: 'rgba(0, 0, 0, 0.5)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.5)',
	},
	s8: {
		default: 'rgba(0, 0, 0, 0.6)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.6)',
	},
	s9: {
		default: 'rgba(0, 0, 0, 0.7)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.7)',
	},
	s10: {
		default: 'rgba(0, 0, 0, 0.8)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.8)',
	},
	s11: {
		default: 'rgba(0, 0, 0, 0.9)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.9)',
	},
	s12: {
		default: 'rgba(0, 0, 0, 0.95)',
		[SUPPORTS_OKLCH]: 'oklch(0% 0 0 / 0.95)',
	},
})

export const whiteAlpha = stylex.defineVars({
	s1: {
		default: 'rgba(255, 255, 255, 0.05)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.05)',
	},
	s2: {
		default: 'rgba(255, 255, 255, 0.1)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.1)',
	},
	s3: {
		default: 'rgba(255, 255, 255, 0.15)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.15)',
	},
	s4: {
		default: 'rgba(255, 255, 255, 0.2)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.2)',
	},
	s5: {
		default: 'rgba(255, 255, 255, 0.3)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.3)',
	},
	s6: {
		default: 'rgba(255, 255, 255, 0.4)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.4)',
	},
	s7: {
		default: 'rgba(255, 255, 255, 0.5)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.5)',
	},
	s8: {
		default: 'rgba(255, 255, 255, 0.6)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.6)',
	},
	s9: {
		default: 'rgba(255, 255, 255, 0.7)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.7)',
	},
	s10: {
		default: 'rgba(255, 255, 255, 0.8)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.8)',
	},
	s11: {
		default: 'rgba(255, 255, 255, 0.9)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.9)',
	},
	s12: {
		default: 'rgba(255, 255, 255, 0.95)',
		[SUPPORTS_OKLCH]: 'oklch(99.99999935% 4e-8 90.00000094 / 0.95)',
	},
})
