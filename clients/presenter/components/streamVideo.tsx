import * as React from 'react'

export interface StreamVideoProps {
  stream: MediaStream
}

export class StreamVideo extends React.Component<StreamVideoProps, {}> {
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
    if (this.video && this.video.current && this.video.current.srcObject !== this.props.stream) {
      this.video.current.srcObject = this.props.stream
    }
  }

  render() {
    return <video ref={this.video} playsInline autoPlay />
  }
}
