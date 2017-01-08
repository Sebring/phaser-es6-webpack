import Phaser from 'phaser'
import {gameSettings} from '../gameSettings'

export default class extends Phaser.Sprite {

  constructor ({ game, x, y, asset }) {
    super(game, x, y, asset)

    let size = gameSettings().squareSize

    this.game = game
    this.anchor.setTo(0.5)
    this.width = size
    this.height = size
    this.canJump = true
	
    // add physics
  	this.game.physics.enable(this, Phaser.Physics.ARCADE)
    this.body.velocity.x = 170
    this.body.gravity.y = 450
  }

  update () {
    //this.angle += 1
  }

}
