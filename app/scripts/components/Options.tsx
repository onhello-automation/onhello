import { PaletteType } from '@material-ui/core'
import Button from '@material-ui/core/Button'
import Container from '@material-ui/core/Container'
import FormControl from '@material-ui/core/FormControl'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import Paper from '@material-ui/core/Paper'
import Radio from '@material-ui/core/Radio'
import RadioGroup from '@material-ui/core/RadioGroup'
import { createStyles, Theme, WithStyles, withStyles } from '@material-ui/core/styles'
import TextareaAutosize from '@material-ui/core/TextareaAutosize'
import TextField from '@material-ui/core/TextField'
import Typography from '@material-ui/core/Typography'
import jp from 'jsonpath'
import React from 'react'
import { browser } from 'webextension-polyfill-ts'
import { ErrorHandler } from '../error_handler'
import { getMessage } from '../i18n_helper'
import { getResponse } from '../response'
import { APP_DEFAULTS, checkRules, Rule, Rules, RulesSettings } from '../rules/rules'
import { setupUserSettings, ThemePreferenceType } from '../user'
import { DARK_MODE_INPUT_BACKGROUND_COLOR, DARK_MODE_INPUT_COLOR, isDarkModePreferred } from './AppTheme'

const styles = (theme: Theme) => createStyles({
	title: {
		marginBottom: theme.spacing(1),
	},
	section: {
		marginBottom: theme.spacing(2),
	},
	buttonHolder: {
		paddingTop: '4px',
	},
	radioSelection: {
		marginLeft: theme.spacing(2),
	},
	instructions: {
		marginBottom: '1em',
	},
	testRulesResponseSection: {
		marginBottom: '1em',
		marginTop: '1em',
		paddingBottom: '1em',
		paddingTop: '1em',
		minHeight: '4em',
	},
	button: {
		color: 'black',
		marginBottom: '0.25em',
		marginTop: '0.25em',
	},
	rulesUi: {
		marginBottom: '1em',
	},
	ruleExactMatch: {
		width: '70%',
	},
	rulePattern: {
		width: '70%',
	},
	ruleFlags: {
		width: '10%',
	},
	longInput: {
		width: '90%',
		marginBottom: '1em',
	},
	appSection: {
		marginBottom: '1em',
		marginTop: '1em',
		paddingBottom: '1em',
		paddingTop: '1em',
	},
	ruleSection: {
		marginLeft: '3%',
	},
	rulesInput: {
		width: '80%'
	},
	rulesInputError: {
		borderColor: 'red',
		borderWidth: 'medium',
	},
})

class Options extends React.Component<WithStyles<typeof styles>, {
	themePreference: ThemePreferenceType | ''
	rulesJson: string
	errorInRules: string | undefined
	rulesTestText: string
	rulesTestApp: string
	rulesTestResponse: string
}> {
	private errorHandler = new ErrorHandler(undefined)

	constructor(props: any) {
		super(props)
		this.state = {
			themePreference: '',
			rulesJson: '',
			errorInRules: undefined,
			rulesTestText: "",
			rulesTestApp: 'teams',
			rulesTestResponse: "",
		}

		this.deleteRule = this.deleteRule.bind(this)
		this.handleChange = this.handleChange.bind(this)
		this.handleRulesChange = this.handleRulesChange.bind(this)
		this.handleThemeChange = this.handleThemeChange.bind(this)
		this.saveRules = this.saveRules.bind(this)
		this.setResponse = this.setResponse.bind(this)
		this.testRules = this.testRules.bind(this)
		this.updateRules = this.updateRules.bind(this)
	}

	async componentDidMount(): Promise<void> {
		setupUserSettings(['themePreference', 'rules']).then((userSettings) => {
			const { themePreference } = userSettings
			let { rules } = userSettings
			rules = JSON.stringify(rules, null, 4)
			this.setState({
				themePreference: themePreference || 'device',
				rulesJson: rules,
			})
		})
	}

	setRules(rules: RulesSettings): void {
		// Don't let rules be invalid.
		for (const app of rules.apps) {
			for (const rule of app.rules) {
				if (rule.messageExactMatch === undefined && rule.messagePattern === undefined) {
					rule.messageExactMatch = ""
				}
				if (!Array.isArray(rule.responses) || rule.responses.length === 0) {
					rule.responses = [""]
				}
			}
		}
		this.setState({ rulesJson: JSON.stringify(rules, null, 4) })
	}

	handleChange(event: React.ChangeEvent<HTMLInputElement>): void {
		const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
		this.setState<never>({
			[event.target.name]: value,
		})
	}

	handleRulesChange(event: React.ChangeEvent<HTMLTextAreaElement>): void {
		const value = event.target.value
		let errorInRules = undefined
		try {
			const parsed = JSON.parse(value)
			checkRules(parsed)
		} catch (err) {
			errorInRules = err.toString()
		}
		this.setState<never>({
			[event.target.name]: value,
			errorInRules,
		})
	}

	handleThemeChange(event: React.ChangeEvent<HTMLInputElement>) {
		const themePreference = event.target.value as PaletteType | 'device'
		this.setState({
			themePreference,
		})
		const keys = {
			themePreference,
		}
		browser.storage.local.set(keys).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
		browser.storage.sync.set(keys).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
	}

	saveRules(): void {
		let rules
		try {
			rules = JSON.parse(this.state.rulesJson)
			checkRules(rules)
		} catch (err) {
			alert(`Error parsing rules: ${err}.`)
			return
		}
		rules.dateModified = new Date().toString()
		browser.storage.local.set({ rules }).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
		browser.storage.sync.set({ rules }).catch(errorMsg => {
			this.errorHandler.showError({ errorMsg })
		})
	}

	setResponse(appIndex: number, ruleIndex: number, responseIndex: number, response: string): void {
		const rules: RulesSettings = JSON.parse(this.state.rulesJson)
		if (rules.apps[appIndex].rules[ruleIndex].responses === undefined) {
			rules.apps[appIndex].rules[ruleIndex].responses = []
		}
		if (responseIndex === rules.apps[appIndex].rules[ruleIndex].responses.length) {
			rules.apps[appIndex].rules[ruleIndex].responses.push(response)
		} else if (response === "" && rules.apps[appIndex].rules[ruleIndex].responses.length > 1) {
			rules.apps[appIndex].rules[ruleIndex].responses.splice(responseIndex, 1)
		} else {
			rules.apps[appIndex].rules[ruleIndex].responses[responseIndex] = response
		}
		this.setRules(rules)
	}

	deleteRule(appIndex: number, ruleIndex: number): void {
		const rules: RulesSettings = JSON.parse(this.state.rulesJson)
		rules.apps[appIndex].rules.splice(ruleIndex, 1)
		this.setRules(rules)
	}

	testRules(rulesTestText: string): void {
		const { rulesTestApp } = this.state
		const settings: RulesSettings = JSON.parse(this.state.rulesJson)

		const rules = settings.apps.find(app => app.name === rulesTestApp)
		let rulesTestResponse = ""
		if (rules) {
			// Should always be found.
			const response = getResponse("First_Name Last_Name", rulesTestText, rules.rules)
			if (response) {
				rulesTestResponse = response.text
			}
		}
		this.setState({
			rulesTestText,
			rulesTestResponse,
		})
	}

	updateRules(path: string, value: string | undefined | object): void {
		const rules: RulesSettings = JSON.parse(this.state.rulesJson)
		jp.value(rules, path, value)
		this.setRules(rules)
	}

	renderRulesUi(): React.ReactNode {
		const { classes } = this.props

		if (this.state.errorInRules) {
			return <div></div>
		}

		// Extra check just in case.
		let rules: RulesSettings
		try {
			rules = JSON.parse(this.state.rulesJson)
			checkRules(rules)
		} catch (err) {
			return <div className={classes.rulesInputError}>
				{`${err}`}
			</div>
		}

		return <div className={classes.rulesUi}>
			{rules.apps.map((settings, appIndex) => {
				const defaults = APP_DEFAULTS[settings.name]
				return <Paper key={`rules-${appIndex}`} className={classes.appSection}>
					<Container>
						{/* Labels on TextFields don't work well when rendered dynamically */}
						{/* TODO Move labels to messages.json */}
						<Typography component="p">
							{"App name (only \"teams\" is supported for now)"}
						</Typography>
						<TextField name='onhelloAppName' required
							key={`appName-${appIndex}`}
							variant="outlined"
							type="text"
							placeholder={"teams"}
							value={settings.name}
							onChange={(event) => this.updateRules(`$.apps[${appIndex}].name`, event.target.value)}
							style={{ display: 'block', }}
						/>
						<Typography component="p">
							{"URL pattern of requests to get messages. Leave the default value if you're not sure what to put."}
						</Typography>
						<TextField name='onhelloUrlPattern'
							key={`urlPattern-${appIndex}`}
							fullWidth
							className={classes.longInput}
							variant="outlined"
							value={settings.urlPattern || ""}
							placeholder={defaults ? defaults.urlPattern : undefined}
							onChange={(event) => this.updateRules(`$.apps[${appIndex}].urlPattern`, event.target.value)}
							style={{ display: 'block', }}
						/>
						<Typography component="p">
							{"Reply URL. Leave the default value if you're not sure what to put."}
						</Typography>
						<TextField name='onhelloReplyUrl'
							fullWidth
							className={classes.longInput}
							variant="outlined"
							value={settings.replyUrl || ""}
							placeholder={defaults ? defaults.replyUrl : undefined}
							onChange={(event) => this.updateRules(`$.apps[${appIndex}].replyUrl`, event.target.value)}
							style={{ display: 'block', }}
						/>
						{settings.rules.map((rule, ruleIndex) => {
							return <div key={`rule-${settings.name}-${appIndex}-${ruleIndex}`}
								className={classes.ruleSection}
							>
								<Typography component="h6" variant="h6" style={{ marginTop: '0.5em' }}>
									{`${settings.name} Rule ${ruleIndex + 1}`}
								</Typography>
								<Button className={classes.button}
									color="secondary"
									onClick={() => { this.deleteRule(appIndex, ruleIndex) }}>
									{getMessage('deleteRule') || "Delete Rule"}
								</Button>
								<Typography component="p">
									{"Exact Match"}
								</Typography>
								<TextField
									className={classes.ruleExactMatch}
									variant="outlined"
									value={rule.messageExactMatch || ""}
									onChange={(event) => this.updateRules(`$.apps[${appIndex}].rules[${ruleIndex}].messageExactMatch`, event.target.value)}
									style={{ display: 'block' }}
								/>
								<div style={{ display: 'block' }}>
									<Typography component="p">
										{getMessage('rulesRegexInstructions')}
									</Typography>
									<TextField
										className={classes.rulePattern}
										variant="outlined"
										value={rule.messagePattern || ""}
										placeholder="pattern"
										onChange={(event) => this.updateRules(`$.apps[${appIndex}].rules[${ruleIndex}].messagePattern`, event.target.value)}
										style={{ marginRight: '1em' }}
									/>
									<TextField
										className={classes.ruleFlags}
										variant="outlined"
										value={rule.regexFlags || ""}
										placeholder="flags"
										onChange={(event) => this.updateRules(`$.apps[${appIndex}].rules[${ruleIndex}].regexFlags`, event.target.value)}
									/>
								</div>
								<Typography component="p">
									{getMessage('responsesInstructions')}
								</Typography>
								{rule.responses.map((response, responseIndex) => {
									return <TextField key={`response-${settings.name}-${appIndex}-${ruleIndex}-${responseIndex}`}
										className={classes.longInput}
										fullWidth
										variant="outlined"
										value={response}
										// TODO Allow clicking Enter to add a response.
										onChange={(event) => { this.setResponse(appIndex, ruleIndex, responseIndex, event.target.value) }}
										style={{ display: 'block', marginBottom: '2px', }}
									/>
								})}
								<Button className={classes.button}
									onClick={() => { this.setResponse(appIndex, ruleIndex, rule.responses.length, "") }}>
									{getMessage('addResponseButton') || "Add Response"}
								</Button>
							</div>
						})}
						<Button className={classes.button}
							onClick={() => this.updateRules(`$.apps[${appIndex}].rules[${settings.rules.length}]`, {
								messageExactMatch: "",
								responses: [""],
							} as Rule)}
						>
							{getMessage('addRule') || "Add Rule"}
						</Button>
					</Container>
				</Paper>
			})}
			<Button className={classes.button}
				onClick={() => this.updateRules(`$.apps[${rules.apps.length}]`, {
					name: "teams",
					rules: [{
						messageExactMatch: "",
						responses: [""],
					}],
				} as Rules)}
			>
				{getMessage('addApp') || "Add App"}
			</Button>
		</div >
	}

	renderRulesTestSection(): React.ReactNode {
		if (this.state.errorInRules) {
			return <div></div>
		}
		const { classes } = this.props

		// Extra check just in case.
		let rules: RulesSettings
		try {
			rules = JSON.parse(this.state.rulesJson)
			checkRules(rules)
		} catch (err) {
			return <div className={classes.rulesInputError}>
				{`${err}`}
			</div>
		}

		return <div className={classes.section}>
			<Typography component="h5" variant="h5" className={classes.instructions}>
				{getMessage('testRulesSectionTitle')}
			</Typography>
			<FormControl className={classes.radioSelection} component="fieldset">
				<Typography component="p" className={classes.instructions}>
					{getMessage('testRulesAppSelectionTitle') || "App"}
				</Typography>
				<RadioGroup aria-label="theme" name="theme" value={this.state.rulesTestApp} onChange={(event) => {
					this.setState({ rulesTestApp: event.target.value })
				}}>
					{rules.apps.map((app, appIndex) => {
						return <FormControlLabel
							key={`testRules-app-selection-${appIndex}`}
							value={app.name} control={<Radio />} label={app.name} />
					})}
				</RadioGroup>
			</FormControl>
			<Typography component="p" className={classes.instructions}>
				{getMessage('testRulesInstructions')}
			</Typography>
			<TextField
				fullWidth
				className={classes.longInput}
				variant="outlined"
				placeholder={"Enter your message"}
				value={this.state.rulesTestText || ""}
				onChange={(event) => this.testRules(event.target.value)}
				style={{ display: 'block', }}
			/>
			<Typography component="p" className={classes.instructions}>
				{getMessage('testRulesResponse')}
			</Typography>
			<Paper className={classes.testRulesResponseSection}>
				<Container>
					<Typography component="p">
						{this.state.rulesTestResponse}
					</Typography>
				</Container>
			</Paper>
		</div>
	}

	render(): React.ReactNode {
		const { classes } = this.props

		let inputBackground: string | undefined = undefined, inputColor: string | undefined = undefined
		const { themePreference } = this.state
		if (themePreference === 'dark' || (themePreference === 'device' && isDarkModePreferred())) {
			inputBackground = DARK_MODE_INPUT_BACKGROUND_COLOR
			inputColor = DARK_MODE_INPUT_COLOR
		}

		return <Container>
			<Typography className={classes.title} component="h4" variant="h4">
				{getMessage('optionsPageTitle') || "⚙️ Options"}
			</Typography>

			<div className={classes.section}>
				<Typography component="h5" variant="h5">
					{getMessage('themeSectionTitle') || "Theme"}
				</Typography>
				<Typography component="p">
					{getMessage('themePreferenceDescription')}
				</Typography>
				<FormControl className={classes.radioSelection} component="fieldset">
					<RadioGroup aria-label="theme" name="theme" value={this.state.themePreference} onChange={this.handleThemeChange}>
						<FormControlLabel value="light" control={<Radio />} label="Light" />
						<FormControlLabel value="dark" control={<Radio />} label="Dark" />
						<FormControlLabel value="device" control={<Radio />} label="Device Preference" />
					</RadioGroup>
				</FormControl>
			</div>
			{this.renderRulesTestSection()}
			<div className={classes.section}>
				<Typography component="h5" variant="h5">
					{getMessage('rulesSectionTitle') || "Rules"}
				</Typography>
				<Typography component="p" className={classes.instructions}>
					{getMessage('rulesInstructions')}
				</Typography>
				<Typography component="p" className={classes.instructions}>
					{getMessage('rulesResponsesInstructions')}
				</Typography>
				{/* Rules UI */}
				{this.renderRulesUi()}
				<Typography component="p">
					{getMessage('saveInstructions')}
				</Typography>
				<div>
					<Button className={classes.button}
						onClick={this.saveRules}>
						{getMessage('saveRules')}
					</Button>
				</div>
			</div>
			<div className={classes.section}>
				{/* Raw Rules */}
				<Typography component="h5" variant="h5">
					{getMessage('rawRulesSectionTitle') || "Raw Rules"}
				</Typography>
				<Typography component="p" className={classes.instructions}>
					{getMessage('rulesRawInstructions')}
				</Typography>
				{this.state.errorInRules && <Typography component="p" className={`${classes.instructions} ${classes.rulesInputError}`}>
					{this.state.errorInRules}
				</Typography>}
				<TextareaAutosize name="rulesJson"
					className={`${classes.instructions} ${classes.rulesInput} ${this.state.errorInRules ? classes.rulesInputError : ''}`}
					spellCheck={false}
					aria-label="Enter your rules"
					onChange={this.handleRulesChange}
					value={this.state.rulesJson}
					style={{ backgroundColor: inputBackground, color: inputColor, }}
				/>
				<Typography component="p">
					{getMessage('saveInstructions')}
				</Typography>
				<div>
					<Button className={classes.button}
						onClick={this.saveRules}>
						{getMessage('saveRules')}
					</Button>
				</div>
			</div>
			<div className={classes.section}>
				<Typography component="h5" variant="h5">
					{getMessage('advancedSectionTitle') || "Advanced"}
				</Typography>
				<Typography component="p" className={classes.instructions}>
					{getMessage('advancedInfo')}
				</Typography>
			</div>
		</Container >
	}
}

export default withStyles(styles)(Options)
