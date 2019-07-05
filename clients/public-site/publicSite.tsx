import * as React from 'react';
import { Header } from './components/header';
import { Introduction } from './components/introduction';

export class PublicSite extends React.Component<{}, {}> {

  render() {
    return (<div>
      <Header />
      <Introduction />
    </div>)
  }

}
