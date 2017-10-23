import * as React from 'react'
import { observer } from 'mobx-react'
import styled from 'styled-components'

export interface IAdminRouteProps {
  className: string
}

@observer
class AdminRoute extends React.Component<IAdminRouteProps, {}> {
  render() {
    const { className } = this.props

    return (
      <Container className={className}>
        <h1>Admin</h1>
        <p>This is a protected admin route.</p>
        <p>You should not be able to see this unless you are authenticated</p>
      </Container>
    )
  }
}

const Container = styled.div`
`

export default AdminRoute
