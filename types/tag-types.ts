export interface Tag {
    id: string
    name: string
    color?: string
    tagTypeId: string
  }
  
  export interface TagType {
    id: string
    name: string
    color: string
    tags?: Tag[]
  }
  
  