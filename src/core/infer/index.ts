import { Iimage, IimageInfo } from "../../Ielement/Iimage";

export enum I_ELEMENT_TYPES {
  
    I_IMAGE='I_IMAGE'
}

export interface IElements {

    [I_ELEMENT_TYPES.I_IMAGE]: Iimage
}

export interface IElementTypes {

    [I_ELEMENT_TYPES.I_IMAGE]: typeof Iimage
}


export interface IElementParams{

    [I_ELEMENT_TYPES.I_IMAGE]: IimageInfo
}