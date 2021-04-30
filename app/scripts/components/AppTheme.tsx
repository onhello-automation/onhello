import { PaletteType, ThemeProvider } from '@material-ui/core'
import blue from '@material-ui/core/colors/blue'
import CssBaseline from '@material-ui/core/CssBaseline'
import { createMuiTheme } from '@material-ui/core/styles'
import React from 'react'
import { setupUserSettings } from '../user'

export function isDarkModePreferred(): boolean {
	return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
}

type Props = {
	children: JSX.Element | JSX.Element[],
	// themePreference: PaletteType | 'device'
}

export class AppTheme extends React.Component<Props, {
	themePreference: PaletteType,
}> {
	constructor(props: Props) {
		super(props)
		this.state = {
			// Defaulting to light makes the page not flash black in light mode.
			// In dark mode, the page will always start white.
			// A person's device preference is likely to be the same as their preference here, so defaulting to a device should mininize a possible quick flash (like most pages have anyway).
			themePreference: isDarkModePreferred() ? 'dark' : 'light',
		}
	}

	async componentDidMount(): Promise<void> {
		let { themePreference } = await setupUserSettings(['themePreference'])
		if (themePreference === 'device') {
			themePreference = isDarkModePreferred() ? 'dark' : 'light'
		}
		if (themePreference !== this.state.themePreference) {
			this.setState({
				themePreference,
			})
		}
	}

	render(): React.ReactNode {
		let { themePreference } = this.state

		const themeOptions = {
			palette: {
				type: themePreference,
			},
		}

		if (themePreference === 'dark') {
			// Easier to see in dark mode.
			(themeOptions.palette as any).primary = {
				main: blue[300],
			}
		}
		const theme = createMuiTheme(themeOptions)
		return (
			<ThemeProvider theme={theme}>
				<CssBaseline />
				{this.props.children}
			</ThemeProvider>
		)
	}
}