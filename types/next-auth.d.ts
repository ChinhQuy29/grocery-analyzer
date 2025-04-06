import "next-auth"
import "next-auth/jwt"

interface Measurements {
  height?: {
    value: number;
    unit: "cm" | "in";
  };
  weight?: {
    value: number;
    unit: "kg" | "lb";
  };
  age?: number;
  gender?: "male" | "female" | "other" | "prefer_not_to_say";
  activityLevel?: "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active";
}

declare module "next-auth" {
  interface User {
    id: string
    name: string
    email: string
    goal?: string
    measurements?: Measurements
  }

  interface Session {
    user: User & {
      id: string
      goal?: string
      measurements?: Measurements
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    goal?: string
    measurements?: Measurements
  }
}

