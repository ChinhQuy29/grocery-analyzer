import { Schema, models, model } from "mongoose"

// Height Schema
const heightSchema = new Schema({
  value: { type: Number, default: null },
  unit: { type: String, enum: ["cm", "in"], default: "cm" }
}, { _id: false });

// Weight Schema
const weightSchema = new Schema({
  value: { type: Number, default: null },
  unit: { type: String, enum: ["kg", "lb"], default: "kg" }
}, { _id: false });

// Measurements Schema
const measurementsSchema = new Schema({
  height: { type: heightSchema, default: () => ({}) },
  weight: { type: weightSchema, default: () => ({}) },
  age: { type: Number, default: null },
  gender: { type: String, enum: ["male", "female", "other", "prefer_not_to_say"], default: null },
  activityLevel: { 
    type: String, 
    enum: ["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"],
    default: "moderately_active"
  }
}, { _id: false });

// Measurement Schema
const measurementSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    height: {
      value: Number,
      unit: {
        type: String,
        enum: ["cm", "in"],
        default: "cm",
      },
    },
    weight: {
      value: Number,
      unit: {
        type: String,
        enum: ["kg", "lb"],
        default: "kg",
      },
    },
    age: Number,
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say"],
    },
    activityLevel: {
      type: String,
      enum: ["sedentary", "lightly_active", "moderately_active", "very_active", "extremely_active"],
      default: "moderately_active",
    },
  },
  { timestamps: true },
)

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
export const Measurement = models.Measurement || model("Measurement", measurementSchema)

