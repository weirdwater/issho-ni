import * as React from 'react'
import { info } from '../../shared/logger';

export interface StreamVideoProps {
  stream: MediaStream
}

export class StreamVideo extends React.Component<StreamVideoProps> {
  private video = React.createRef<HTMLVideoElement>()

  constructor(props: StreamVideoProps) {
    super(props)

    this.updateStream = this.updateStream.bind(this)
  }

  componentDidMount() {
    this.updateStream()
  }

  componentDidUpdate() {
    this.updateStream()
  }

  updateStream() {
    info('updateStream')

    if (!this.video) {
      info('updateStream: no video found...')
      return window.setTimeout(() => {
        info('calling updatestream after 500')
        this.updateStream()
      }, 500)
    }

    if (this.video.current && this.video.current.srcObject !== this.props.stream) {
      info('updateStream: makes the cut')
      this.video.current.srcObject = this.props.stream
    }
  }

  render() {
    return <video ref={this.video} playsInline autoPlay onLoadedMetadata={this.updateStream} />
  }
}
