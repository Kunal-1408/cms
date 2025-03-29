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
  projectTypeId: string
  tags?: Tag[]
}

export interface ProjectType {
  id: string
  name: string
  tagTypes?: TagType[]
}