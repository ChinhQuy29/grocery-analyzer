import { Schema, models, model } from "mongoose"

// User Schema
const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    goal: {
      type: String,
      enum: ["weight_loss", "weight_gain", "maintenance", "health_improvement"],
      default: "health_improvement",
    },
  },
  { timestamps: true },
)

// Purchase Schema
const purchaseSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    items: [
      {
        name: {
          type: String,
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        nutritionalInfo: {
          calories: Number,
          protein: Number,
          carbs: Number,
          fat: Number,
          sugar: Number,
          fiber: Number,
        },
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
)

// Recommendation Schema
const recommendationSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    recommendations: [
      {
        type: {
          type: String,
          enum: ["increase", "decrease", "add", "remove"],
          required: true,
        },
        category: {
          type: String,
          required: true,
        },
        item: String,
        reason: String,
      },
    ],
    summary: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
)

export const User = models.User || model("User", userSchema)
export const Purchase = models.Purchase || model("Purchase", purchaseSchema)
export const Recommendation = models.Recommendation || model("Recommendation", recommendationSchema)

