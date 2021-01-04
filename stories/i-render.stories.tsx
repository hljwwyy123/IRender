import React, { useEffect, useRef } from 'react';

import { IRender, GL_ELEMENT_TYPES, Iimage } from 'i-render'
import { startFPS, stopFPS } from './fps';

export default {
  title: 'GL RENDER',
  component: Test,
};

export function Test() {
  return <div>
    test...
  </div>
}

const canvasWidth = 2800
const canvasHeight = 1300



const xCount = 85 * 10
const yCount = 25 * 14

const circleR = 40

const borderR = 0


export function IrenderTest() {
    const cRef = useRef()

    const textureRef = useRef<HTMLCanvasElement>()

    const glRenderRef  =  useRef<IRender>()

    useEffect(() =>{

       

        const glRender = new IRender(cRef.current, { maxNumber: xCount * yCount })
        glRenderRef.current = glRender
        const circle = document.createElement('canvas')
        circle.width = (circleR+ borderR) *2
        circle.height = (circleR+ borderR)  *2
        const ctx = circle.getContext('2d')
        ctx.fillStyle= "rgba(50,255,255,0.2)"
        ctx.lineWidth= borderR
        ctx.arc(circleR, circleR, circleR,0,  Math.PI *2)
        ctx.fill()

        
        const [circleImgId] = glRender.loadImgs([circle])

        ctx.clearRect(0,0, circleR *2, circleR *2)
        ctx.fillStyle= "rgba(255,125,125,0.2)"
        ctx.arc(circleR, circleR , circleR, 0,  Math.PI *2 )
        ctx.fill()

        const [halfImgId] = glRender.loadImgs([circle])
        let reqH = { a : 0};
        
        const list:Iimage[] = []
        for(let i =0; i< xCount; i++){
          for( let j =0; j< yCount; j++ ){
            list.push ( 
        
              glRender.createElement(
                GL_ELEMENT_TYPES.GL_IMAGE, 
                { 
                  imgId:list.length%2? circleImgId: halfImgId , 
                  position:  {x: i *circleR * 0.3  , y: j * circleR * 0.3}
                }
              ),
            )
          }
        }

        console.log('total:', list.length)
       
        let frameCount = 0
        const req = () => {
          frameCount++
          
          const l = list.length
          for(let i = 0; i<l; ++i ) {
            list[i].setImgId((frameCount+i)%60? circleImgId: halfImgId)
            // list[i].setPosition(list[i].position.x + Math.sign(frameCount) , list[i].position.y)
          }

          glRender.updateImidiatly()
          reqH.a =requestAnimationFrame(req)
        }
        startFPS()
        req()
        return () => { 
          stopFPS()
          cancelAnimationFrame(reqH.a)
        }
    }, [])

    useEffect(() => {
      const ctx = textureRef.current.getContext('2d')
      ctx.drawImage( glRenderRef.current.getTexture(), 0,0, 200,200, 0,0, 200,200 )
    }, [])

    // style={{ backgroundColor: 'black' }} 
    return <div >
      <canvas ref={cRef} width={canvasWidth} height={canvasHeight} 
        style={{ 
          width : canvasWidth / devicePixelRatio, 
          height: canvasHeight/devicePixelRatio,
          backgroundColor: 'rgb(122,122,122,1)'
        }} />
      <canvas ref={textureRef} width={200} height={200} style={{backgroundColor:'rgb(122,122,122,1)'}} ></canvas>

      <div 
        id="fps"
        style={{
          backgroundColor:'white',
          position: 'fixed',
          left: 0,
          top: 0,
        }}
      />
   </ div >
}



  
  // ToStorybook.story = {
  //   name: 'render test',
  // };