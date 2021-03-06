// @flow
import * as React from 'react'
import PropTypes from 'prop-types'
import warning from './warning'
import {
  createForm,
  formSubscriptionItems,
  version as ffVersion
} from 'final-form'
import type { Api, Config, FormSubscription, FormState } from 'final-form'
import type { FormProps as Props, ReactContext } from './types'
import renderComponent from './renderComponent'
export const version = '1.0.0'

export const all: FormSubscription = formSubscriptionItems.reduce(
  (result, key) => {
    result[key] = true
    return result
  },
  {}
)

type State = {
  state: FormState
}

export default class ReactFinalForm extends React.PureComponent<Props, State> {
  context: ReactContext
  props: Props
  state: State
  form: Api
  unsubscribe: () => void

  static childContextTypes = {
    reactFinalForm: PropTypes.object
  }

  static displayName = `ReactFinalForm(${ffVersion})(${version})`

  constructor(props: Props) {
    super(props)
    const {
      children,
      component,
      debug,
      initialValues,
      onSubmit,
      render,
      validate,
      subscription
    } = props
    warning(
      render || typeof children === 'function' || component,
      'Must specify either a render prop, a render function as children, or a component prop'
    )
    const config: Config = {
      debug,
      initialValues,
      onSubmit,
      validate
    }
    try {
      this.form = createForm(config)
    } catch (e) {
      warning(false, e.message)
    }
    let initialState
    this.unsubscribe =
      this.form &&
      this.form.subscribe((state: FormState) => {
        if (initialState) {
          this.notify(state)
        } else {
          initialState = state
        }
      }, subscription || all)
    this.state = { state: initialState }
  }

  getChildContext() {
    return {
      reactFinalForm: this.form
    }
  }

  notify = (state: FormState) => this.setState({ state })
  handleSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    this.form.submit()
  }

  componentWillUnmount() {
    this.unsubscribe()
  }

  render() {
    // remove config props
    const {
      debug,
      initialValues,
      onSubmit,
      subscription,
      validate,
      ...props
    } = this.props
    return renderComponent(
      {
        ...props,
        ...this.state.state,
        batch: this.form && this.form.batch,
        blur: this.form && this.form.blur,
        change: this.form && this.form.change,
        focus: this.form && this.form.focus,
        handleSubmit: this.handleSubmit,
        reset: this.form && this.form.reset
      },
      'ReactFinalForm'
    )
  }
}
