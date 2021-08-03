// React & React Native
import React, { ComponentType, FC, ReactElement } from 'react'

// Libraries
import { RenderResult, RenderOptions, render } from '@testing-library/react'
import { ThemeProvider } from 'styled-components'

// Custom
import theme from 'lib/styled-components/theme'

type Props = {
  children: JSX.Element
}

const AllTheProviders: FC<Props> = ({ children }: Props) => {
  return <ThemeProvider theme={theme}>{children}</ThemeProvider>
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'queries'>,
): RenderResult =>
  render(ui, {
    wrapper: AllTheProviders as ComponentType,
    ...options,
  })

export * from '@testing-library/react'

export { customRender as render }
