import SoundManager from "../utils/SoundManager"

interface CardAnimationProps {
    type: 'deal' | 'flip' | 'burn' | 'reveal'
    position: { x: number; y: number }
    cardType: 'white' | 'blue' | 'gold' | 'red'
    onComplete: () => void
  }
  
  const CardAnimation: React.FC<CardAnimationProps> = ({
    type,
    position,
    cardType,
    onComplete
  }) => {
    useEffect(() => {
      const element = document.createElement('div')
      element.className = `card-animation ${type} ${cardType}`
      document.body.appendChild(element)
  
      // 设置初始位置
      element.style.left = `${position.x}px`
      element.style.top = `${position.y}px`
  
      // 播放对应音效
      switch (type) {
        case 'deal':
          SoundManager.play('deal')
          break
        case 'flip':
          SoundManager.play('flip')
          break
        case 'reveal':
          SoundManager.play('correct')
          break
      }
  
      // 动画结束后清理
      element.addEventListener('animationend', () => {
        element.remove()
        onComplete()
      })
  
      return () => element.remove()
    }, [type, position, cardType, onComplete])
  
    return null
  }