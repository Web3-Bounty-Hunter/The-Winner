class SoundManager {
  private static sounds: { [key: string]: HTMLAudioElement } = {
    deal: new Audio('/sounds/card-deal.mp3'),
    flip: new Audio('/sounds/card-flip.mp3'),
    chip: new Audio('/sounds/chip-stack.mp3'),
    win: new Audio('/sounds/win.mp3'),
    lose: new Audio('/sounds/lose.mp3'),
    question: new Audio('/sounds/question.mp3'),
    correct: new Audio('/sounds/correct.mp3'),
    wrong: new Audio('/sounds/wrong.mp3'),
    shuffle: new Audio('/sounds/card-shuffle.mp3')
  }

  static play(soundName: keyof typeof SoundManager.sounds) {
    const sound = this.sounds[soundName]
    if (sound) {
      sound.currentTime = 0
      sound.play().catch(err => console.log('音效播放失败:', err))
    }
  }
}

export default SoundManager 