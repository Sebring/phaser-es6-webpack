/* globals __DEV__ */
import Phaser from 'phaser'
import Mushroom from '../sprites/Mushroom'
import Tile from '../sprites/Tile'
import {gameSettings} from '../gameSettings'

export default class extends Phaser.State {
  init () {
    this.settings = gameSettings()
    
    this.gameLevels = [
      [ {width: 60, height: 30, x: 200},
        {width: 60, height: 30, x: 400}],

      [ {width: 40, height: 30, x: 250},
        {width: 70, height: 25, x: 450},
        {width: 30, height: 20, x: 100}],

      [ {width: 10, height: 35, x: 150},
        {width: 10, height: 35, x: 300},
        {width: 10, height: 35, x: 550}],

      [ {width: 80, height: 10, x: 280},
        {width: 60, height: 10, x: 50}],

      [ {width: 10, height: 30, x: 150},
        {width: 10, height: 30, x: 190},
        {width: 40, height: 20, x: 170},
        {width: 70, height: 10, x: 350},
        {width: 30, height: 20, x: 350},
        {width: 20, height: 30, x: 350},
        {width: 10, height: 40, x: 350}]
    ]
  }

  preload () {}

  create () {
    // group for ground
    this.groundGroup = game.add.group()
    
    // group for obstacles
    this.spikeGroup = game.add.group()

    this.levelFloor = 0

    this.hero = new Mushroom({
      game: this,
      x: this.settings.floorX + this.settings.squareSize / 2,
      y: this.settings.floorY[0] - this.settings.squareSize / 2,
      asset: 'mushroom'
    })

    this.game.add.existing(this.hero)

    this.createFloors();

    this.emitter = game.add.emitter(0, 0, 30)
    this.emitter.makeParticles('mushroom')
    // gravity takes a point (x,y), not an integer
    this.emitter.gravity.y = 200

    this.emitter.maxParticleScale = 0.1
    this.emitter.minParticleScale = 0.05
    
    //this.emitter.maxParticleSpeed.set(200,200)
    //this.emitter.minParticleSpeed.set(-200,-200)

    // waiting for player input, then call squareJump function
    game.input.onDown.add(this.heroJump, this)
    game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR).onDown.add(this.heroJump, this)
    
  }

  heroJump() {
    // fast bail
    if (!this.hero.canJump)
      return;
    
    this.hero.body.velocity.y = this.settings.jumpForce
    this.hero.canJump = false;
    
    // setting a jump rotation angle just to make the square rotate
    var jumpAngle = this.levelFloor % 2 == 0 ? 360  : -360;
    // using a tween to rotate the player
    this.jumpTween = game.add.tween(this.hero).to({
        angle: this.hero.angle + jumpAngle
    }, this.settings.jumpTime, Phaser.Easing.Linear.None, true)
  }

  createFloors() {
    // time to create the floors
    for(let i = 0; i < this.settings.floorY.length; i++) {
       // each floor is a tile sprite
       var floor = this.game.add.tileSprite(this.settings.floorX, this.settings.floorY[i], this.settings.floorWidth, this.settings.floorHeight, "tile")
       // let's enable ARCADE physics on floors too
       this.game.physics.enable(floor, Phaser.Physics.ARCADE)
       // floors can't move
       floor.body.immovable = true
       // adding the floor to ground group
       this.groundGroup.add(floor)

      // add obstacles
      //console.log(`i : ${i} `)
      for (let j=0, N=this.gameLevels[i].length; j<N; j++) { 
        //console.log(`j : ${j} `)
        // create spike using tile and position from settings and gameLevels
        let level = this.gameLevels[i][j]
        let spike = game.add.tileSprite(this.settings.floorX + level.x, this.settings.floorY[i], level.width, level.height, 'tile')
        spike.anchor.set(0.5, 1)
        game.physics.enable(spike, Phaser.Physics.ARCADE)
        spike.body.immovable = true
        this.spikeGroup.add(spike)
      }
    }
  }

  render () {
    if (__DEV__) {
     //this.game.debug.spriteInfo(this.hero, 32, 32)
    }
  }

  update() {
    // making the hero collide with floors so it won't fall down
    this.game.physics.arcade.collide(this.hero, this.groundGroup)

    // if the hero as its feet on the ground, it can jump
    if(this.hero.body.touching.down) {
      this.hero.canJump = true
    }

    // check for spike collision
    game.physics.arcade.overlap(this.hero, this.spikeGroup, function() {
      
      //place emitter on hero
      this.emitter.x = this.hero.x
      this.emitter.y = this.hero.y
      
      // emit particles
      this.emitter.start(true, 1000, null, 10)

      /*  we can no longer restart game by restart state, 
          as it would reset the emitter particles
      // restart
      game.state.start("Game")
      */

      // reset player position
      this.restartLevel()
    }, null, this)

    // if the hero leaves the floor to the right or to the left...
    if((this.hero.x > this.settings.floorX + this.settings.floorWidth && this.levelFloor % 2 == 0) || (this.hero.x < this.settings.floorX && this.levelFloor % 2 == 1)) {

      // no vertical velocity
      this.hero.body.velocity.y = 0

      // increase floor level or reset
      this.levelFloor = ((this.levelFloor +1) % this.settings.floorY.length)
      
      this.restartLevel()
    }
  }

  restartLevel() {
    // adjusting hero speed according to floor number: from left to right on even floors, from right to left on odd floors
    this.hero.body.velocity.x = (this.levelFloor % 2 == 0) ? this.settings.squareSpeed : -this.settings.squareSpeed

    // enable jump
    this.hero.canJump = true

    // update hero
    this.hero.y = this.settings.floorY[this.levelFloor] - this.settings.squareSize / 2
    this.hero.x = (this.levelFloor % 2 == 0) ? this.settings.floorX : this.settings.floorX + this.settings.floorWidth
    // stopping the jump tween if running
    if(this.jumpTween && this.jumpTween.isRunning){
      this.jumpTween.stop();
      this.hero.angle = 0;
    } 
  }
}
