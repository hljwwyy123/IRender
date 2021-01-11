import { Iimage } from '../Ielement/Iimage'
import { FRAGMENT_SHADER, VERTEX_SHADER } from '../shader';
import { compileShader, SHADER_TYPE } from '../util';
import { TextureCanvasManager } from './TextureCanvasManager'
import {  Ielement, UpdateHandle } from '../Ielement/IElement'
import { IElementParams, IElements, IElementTypes, I_ELEMENT_TYPES } from './infer';


export * from './infer/index'


const DEFAULT_OPTION = { maxNumber: 50000, textureSize: 2048 }
export class IRender {

    private  textureCanvas: TextureCanvasManager;
  
    private elemetList: Ielement[] = []

    private GLElemetMap: IElementTypes = {
        [I_ELEMENT_TYPES.I_IMAGE]: Iimage
    }

    private gl:WebGLRenderingContext;

    private uniformLocations: { 
        u_windowSize: WebGLUniformLocation,
        u_textureSize: WebGLUniformLocation,
    };

    private attribuitesLocations: {
        a_position: number
        a_size: number;
        a_texCoord: number;
    };

    private attrData: {
        a_position: Float32Array,
        a_size: Float32Array,
        a_texCoord: Float32Array
    }

    private attrBuffer: {
        a_position: WebGLBuffer,
        a_size: WebGLBuffer,
        a_texCoord: WebGLBuffer
    }
  
    // private needSort = false

    private positionBufferChanged = false

    private imageIdBufferChanged = false

    private textureChange = true

    private rafing = false

    private texture: WebGLTexture

    private options: typeof DEFAULT_OPTION 

    private elementPool = new Set<Ielement>()


    constructor( glCanvas: HTMLCanvasElement,   options?: Partial<typeof DEFAULT_OPTION>   ){
        this.options = { ...DEFAULT_OPTION,  ...options}
        this.textureCanvas =  new  TextureCanvasManager( options.textureSize )
        this.gl = glCanvas.getContext('webgl', { alpha: true })
        const program = this.gl.createProgram()
        compileShader(this.gl, program, VERTEX_SHADER,SHADER_TYPE.VERTEX_SHADER )
        compileShader(this.gl, program, FRAGMENT_SHADER, SHADER_TYPE.FRAGMENT_SHADER)
        this.gl.linkProgram(program)
        this.gl.useProgram(program)
        this.gl.enable(this.gl.BLEND)
        this.gl.blendFunc(this.gl.SRC_ALPHA, this.gl.ONE_MINUS_SRC_ALPHA)

        this.uniformLocations = {
            u_windowSize: this.gl.getUniformLocation(program, 'u_windowSize'),
            u_textureSize: this.gl.getUniformLocation(program, 'u_textureSize')
        }
        this.attribuitesLocations = {
            a_position: this.gl.getAttribLocation(program, 'a_position'),
            a_size: this.gl.getAttribLocation(program, 'a_size'),
            a_texCoord: this.gl.getAttribLocation(program, 'a_texCoord')
        }
        this.initBuffer()
        this.initTexture()
        this.setViewPort()
       
    }


    getTexture = () => {
        return this.textureCanvas.canvas
    }

    
    updateImidiatly = () => {
        // console.log('this.attrBuffer.a_position', this.attrData.a_position)
        if(this.positionBufferChanged) {
           
            this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.attrBuffer.a_position )
            this.gl.bufferData(this.gl.ARRAY_BUFFER, this.attrData.a_position, this.gl.DYNAMIC_DRAW)
        }

        if(this.imageIdBufferChanged ) {

          this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.attrBuffer.a_texCoord )
          this.gl.bufferData(this.gl.ARRAY_BUFFER, this.attrData.a_texCoord, this.gl.DYNAMIC_DRAW)

          this.gl.bindBuffer( this.gl.ARRAY_BUFFER, this.attrBuffer.a_size )
          this.gl.bufferData(this.gl.ARRAY_BUFFER, this.attrData.a_size, this.gl.DYNAMIC_DRAW)
          // console.log('imageIdChanged...')
        }

        this.checkReloadTexure()

        this.gl.drawArrays(this.gl.TRIANGLES, 0, this.elemetList.length *3)

        this.imageIdBufferChanged = false
        this.positionBufferChanged = false
        this.textureChange = false
    }

    private checkReloadTexure = () => {
        if(!this.textureChange) return
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.textureCanvas.canvas)
        console.log('textureChange。。')
    }

    private initTexture() {
        this.gl.uniform2f(this.uniformLocations.u_textureSize, this.options.textureSize, this.options.textureSize)
        this.texture = this.gl.createTexture()
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture)
        this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.NEAREST);
        this.gl.texParameterf(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.NEAREST);
        this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true)
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, this.textureCanvas.canvas)
    }

    private initBuffer(){

        this.attrData  = {
            a_position: new Float32Array(this.options.maxNumber * 3 * 3 ),
            a_size: new Float32Array(this.options.maxNumber * 3 *2 ),
            a_texCoord: new Float32Array(this.options.maxNumber * 3 *2 ),
        }
        const positionBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.attrData.a_position, this.gl.DYNAMIC_DRAW )
        this.gl.enableVertexAttribArray(this.attribuitesLocations.a_position)
        this.gl.vertexAttribPointer(this.attribuitesLocations.a_position, 3, this.gl.FLOAT, false, 0,0)

        const sizeBuffer = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, sizeBuffer)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.attrData.a_size, this.gl.DYNAMIC_DRAW )
        this.gl.enableVertexAttribArray(this.attribuitesLocations.a_size)
        this.gl.vertexAttribPointer(this.attribuitesLocations.a_size, 2, this.gl.FLOAT, false, 0,0)

        const texCoord = this.gl.createBuffer()
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoord)
        this.gl.bufferData(this.gl.ARRAY_BUFFER, this.attrData.a_texCoord, this.gl.DYNAMIC_DRAW )
        this.gl.enableVertexAttribArray(this.attribuitesLocations.a_texCoord)
        this.gl.vertexAttribPointer(this.attribuitesLocations.a_texCoord, 2, this.gl.FLOAT, false, 0,0)

        this.attrBuffer = {
            a_position : positionBuffer,
            a_size: sizeBuffer,
            a_texCoord: texCoord,
        }
    }

    setViewPort(){
        this.gl.viewport( 0, 0, this.gl.canvas.width , this.gl.canvas.height )
        this.gl.uniform2f(this.uniformLocations.u_windowSize, this.gl.canvas.width, this.gl.canvas.height )
    }
  
    createElement<T extends I_ELEMENT_TYPES>( type: T, params: IElementParams[T] ): IElements[T] {
        const handle: UpdateHandle = { 
            updatePosition: this.updatePosition,
            updateImg: this.updateImage,
        }
        if(this.elementPool.size <=0) {

            const el =  new this.GLElemetMap[type](handle, params)
            el.bufferIndex = this.elemetList.length
            this.elemetList.push(el)
            this.updatePosition(el.bufferIndex, el.position)
            this.updateImage(el.bufferIndex, el.imgId)
            // this.update()
            return el

        }else{

            const el = this.elementPool[0]
            this.elementPool.delete(el)
            el.update = handle
            for (let attr in params){
                el[attr] = params
            }
            this.elemetList.push(el)
            this.updatePosition(el.bufferIndex, el.position)
            this.updateImage(el.bufferIndex, el.imgId)
            // this.update()
            return el
        }
      
    }
    private updatePosition: UpdateHandle['updatePosition'] = (bufferIndex, position ) => {

        const startIndex = bufferIndex * 3 *3
        this.attrData.a_position[startIndex] = position.x
        this.attrData.a_position[startIndex + 1] = position.y
        this.attrData.a_position[startIndex + 2] = 1

        this.attrData.a_position[startIndex + 3] = position.x
        this.attrData.a_position[startIndex + 4] = position.y
        this.attrData.a_position[startIndex + 5] = 2

        this.attrData.a_position[startIndex + 6] = position.x
        this.attrData.a_position[startIndex + 7] = position.y
        this.attrData.a_position[startIndex + 8] = 3

        this.positionBufferChanged = true
        this.update()
    }

    destoryElement(ele: Ielement){
        const ind = this.elemetList.findIndex(el => el === ele)
        if(ind > -1){
           const [deleted] =  this.elemetList.splice(ind, 1)
           this.elementPool.add(deleted)
           deleted.position = { x: Number.MIN_VALUE, y:Number.MIN_VALUE }
        }
    }

    loadImgs( imgs: HTMLCanvasElement[] ): number[] {
      const ids = this.textureCanvas.setImages(imgs)
      this.textureChange = true
      return ids
    }
  
    private update = () => {
        if(this.rafing === true) return 
        this.rafing = true
        requestAnimationFrame( () => {
            this.updateImidiatly()
            this.rafing = false
        } )
    }

    // private updateSort = () => {
    //     this.needSort = true
    //     this.update()
    // }

    private updateImage: UpdateHandle['updateImg'] = (bufferIndex, imgId) => {

        const startIndex = bufferIndex * 3*2

        const [{ x,y, w, h }] = this.textureCanvas.getImageInfo(imgId)

        this.attrData.a_texCoord[startIndex] = x
        this.attrData.a_texCoord[startIndex + 1] = y

        this.attrData.a_texCoord[startIndex+ 2] = x
        this.attrData.a_texCoord[startIndex + 3] = y

        this.attrData.a_texCoord[startIndex+4] = x
        this.attrData.a_texCoord[startIndex + 5] = y

        this.attrData.a_size[startIndex] = w
        this.attrData.a_size[startIndex + 1] = h

        this.attrData.a_size[startIndex+ 2] = w
        this.attrData.a_size[startIndex + 3] = h

        this.attrData.a_size[startIndex+4] = w
        this.attrData.a_size[startIndex + 5] = h

        this.imageIdBufferChanged = true
        this.update()
    }
  
  }
