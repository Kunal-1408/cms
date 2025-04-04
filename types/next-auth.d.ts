declare module "next-auth" {
    interface User {
      id: string
      email: string
      avatar?: string
    }
  
    interface Session {
      user: User
    }
  }
  
  declare module "next-auth/jwt" {
    interface JWT {
      id: string
      email: string
      avatar?: string
      iat?: number
    }
  }
  
  