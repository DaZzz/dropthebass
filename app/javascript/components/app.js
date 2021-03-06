import React from 'react'
import Gaussian from './gaussian'
import Player from './player'
import Modal from './modal'
import { connect } from 'react-redux'
import { fetchSong } from '../actions'
import d3 from 'd3'


class App extends React.Component {

  constructor(props) {
    super(props)
    this.analyser = null
    this.state = {intensity: 0, modalOpen: false}
  }

  componentDidMount() {
    let TRACK_URL = 'https://soundcloud.com/zomboy/dlmd'
    this.props.dispatch(fetchSong(TRACK_URL))
    this.setupPlayer()
    this.tick()
  }

  componentDidUpdate(prevProps) {
    if (prevProps.song != this.props.song) {
      this.refs.player.play()
    }
  }

  setupPlayer(songUrl) {
    let player =  this.refs.player
    player.crossOrigin = 'Anonymous'

    let audioContext = new (window.AudioContext || window.webkitAudioContext)
    let source = audioContext.createMediaElementSource(player)
    source.connect(audioContext.destination)

    this.analyser = audioContext.createAnalyser()
    this.analyser.fftSize = 1024

    source.connect(this.analyser)
  }

  tick() {
    const DATA_SIZE = 512
    let intensity = 0

    if (this.analyser) {
      let streamData = new Uint8Array(DATA_SIZE)
      this.analyser.getByteFrequencyData(streamData)
      let mean = d3.mean(streamData.slice(0,DATA_SIZE))
      intensity = (Math.max(mean - 20, 0) / 255)
    }

    this.setState({intensity})
    setTimeout(this.tick.bind(this), 1000/60)
    // setTimeout(this.tick.bind(this), 1000)
  }

  onPlay() {
    if (this.refs.player && this.refs.player.paused) {
      this.refs.player.play()
    } else {
      this.refs.player.pause()
    }
  }

  seekTo(value) {
    if (!this.refs.player) return
    this.refs.player.currentTime = value
  }

  setSong(songUrl) {
    if (songUrl.trim().length > 0) {
      this.props.dispatch(fetchSong(songUrl))
      this.setState({modalOpen: false})
    }
  }

  render() {
    let songData = this.props.song.data

    return (
      <div className='visualizer-app'>
        <Gaussian intensity={this.state.intensity}/>

        <Player
          artwork={ songData ? songData.artwork_url : null }
          title={ songData ? songData.title : null }
          author={ songData ? songData.user.username : null }
          time={ this.refs.player ? this.refs.player.currentTime : 0 }
          duration={ this.refs.player && this.refs.player.duration ? this.refs.player.duration : 0.0001}
          isPaused={ this.refs.player ? this.refs.player.paused : true }
          onPlay={ () => this.onPlay() }
          onSeek={ (value) => this.seekTo(value) }
          onOpen={ () => this.setState({modalOpen: true}) }
        />

        <audio
          style={{display: 'none'}}
          ref='player'
          src={ songData ? songData.song_url : ''}
          controls preload>
        </audio>

        <Modal
          isOpen={this.state.modalOpen}
          onOverlayClick={() => this.setState({modalOpen: false})}
          onButtonClick={(value) => this.setSong(value)}
        />
      </div>
    )
  }

}

export default connect(state => state)(App)
