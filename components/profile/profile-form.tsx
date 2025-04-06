"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type MeasurementUnit = "cm" | "in" | "kg" | "lb"
type ActivityLevel = "sedentary" | "lightly_active" | "moderately_active" | "very_active" | "extremely_active"
type Gender = "male" | "female" | "other" | "prefer_not_to_say"

interface ProfileFormProps {
  user: {
    _id: string
    name: string
    email: string
    goal: string
    measurements?: {
      height?: {
        value?: number
        unit?: "cm" | "in"
      }
      weight?: {
        value?: number
        unit?: "kg" | "lb"
      }
      age?: number
      gender?: Gender
      activityLevel?: ActivityLevel
    }
  }
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { update: updateSession } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  
  // Debug log
  console.log("User data received in form:", JSON.stringify(user, null, 2))
  console.log("Measurements received:", user.measurements ? JSON.stringify(user.measurements, null, 2) : "undefined")
  
  // Basic info
  const [name, setName] = useState(user.name)
  const [email, setEmail] = useState(user.email)
  const [goal, setGoal] = useState(user.goal)
  
  // Measurements
  const [heightValue, setHeightValue] = useState<number | undefined>(user.measurements?.height?.value)
  const [heightUnit, setHeightUnit] = useState<"cm" | "in">(user.measurements?.height?.unit || "cm")
  const [weightValue, setWeightValue] = useState<number | undefined>(user.measurements?.weight?.value)
  const [weightUnit, setWeightUnit] = useState<"kg" | "lb">(user.measurements?.weight?.unit || "kg")
  const [age, setAge] = useState<number | undefined>(user.measurements?.age)
  const [gender, setGender] = useState<Gender | undefined>(user.measurements?.gender)
  const [activityLevel, setActivityLevel] = useState<ActivityLevel>(
    user.measurements?.activityLevel || "moderately_active"
  )
  
  // Password
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // Add state for measurements
  const [measurements, setMeasurements] = useState({
    height: {
      value: null,
      unit: "cm"
    },
    weight: {
      value: null,
      unit: "kg"
    },
    age: null,
    gender: null,
    activityLevel: "moderately_active"
  });
  
  // Fetch measurements on component mount
  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        const response = await fetch("/api/measurements");
        const data = await response.json();
        
        if (data.measurements) {
          console.log("Fetched measurements:", data.measurements);
          setMeasurements(data.measurements);
          
          // Update all the state values
          if (data.measurements.height) {
            setHeightValue(data.measurements.height.value);
            setHeightUnit(data.measurements.height.unit || "cm");
          }
          
          if (data.measurements.weight) {
            setWeightValue(data.measurements.weight.value);
            setWeightUnit(data.measurements.weight.unit || "kg");
          }
          
          if (data.measurements.age !== undefined) {
            setAge(data.measurements.age);
          }
          
          if (data.measurements.gender) {
            setGender(data.measurements.gender);
          }
          
          if (data.measurements.activityLevel) {
            setActivityLevel(data.measurements.activityLevel);
          }
        }
      } catch (error) {
        console.error("Error fetching measurements:", error);
      }
    };
    
    fetchMeasurements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate passwords if attempting to change
    if (newPassword) {
      if (!currentPassword) {
        toast({
          title: "Error",
          description: "Current password is required to set a new password",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        toast({
          title: "Error",
          description: "New passwords do not match",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    try {
      // Two parallel requests: one for profile, one for measurements
      const [profileResponse, measurementsResponse] = await Promise.all([
        // Update basic profile info
        fetch("/api/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            goal,
            currentPassword: currentPassword || undefined,
            newPassword: newPassword || undefined,
          }),
        }),
        
        // Update measurements separately
        fetch("/api/measurements", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            height: { 
              value: heightValue !== undefined ? heightValue : null, 
              unit: heightUnit 
            },
            weight: { 
              value: weightValue !== undefined ? weightValue : null, 
              unit: weightUnit 
            },
            age: age !== undefined ? age : null,
            gender: gender || null,
            activityLevel: activityLevel,
          }),
        })
      ]);

      // Check if both responses are OK
      if (!profileResponse.ok) {
        const error = await profileResponse.json();
        throw new Error(error.message || "Failed to update profile");
      }

      if (!measurementsResponse.ok) {
        const error = await measurementsResponse.json();
        throw new Error(error.message || "Failed to update measurements");
      }

      // Reset password fields
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // Update the session
      await updateSession({
        name,
        email,
        goal,
      });

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });

      // Force a complete page reload
      window.location.href = '/profile';
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Basic Info</TabsTrigger>
          <TabsTrigger value="measurements">Measurements</TabsTrigger>
          <TabsTrigger value="password">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Health Goal</Label>
            <Select value={goal} onValueChange={setGoal}>
              <SelectTrigger>
                <SelectValue placeholder="Select your health goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weight_loss">Weight Loss</SelectItem>
                <SelectItem value="weight_gain">Weight Gain</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="health_improvement">General Health Improvement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="measurements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="heightValue">Height</Label>
              <div className="flex gap-2">
                <Input
                  id="heightValue"
                  type="number"
                  value={heightValue || ""}
                  onChange={(e) => setHeightValue(e.target.value === "" ? undefined : Number(e.target.value))}
                  className="flex-1"
                />
                <Select value={heightUnit} onValueChange={(value) => setHeightUnit(value as "cm" | "in")}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="weightValue">Weight</Label>
              <div className="flex gap-2">
                <Input
                  id="weightValue"
                  type="number"
                  value={weightValue || ""}
                  onChange={(e) => setWeightValue(e.target.value === "" ? undefined : Number(e.target.value))}
                  className="flex-1"
                />
                <Select value={weightUnit} onValueChange={(value) => setWeightUnit(value as "kg" | "lb")}>
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="lb">lb</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                type="number"
                value={age || ""}
                onChange={(e) => setAge(e.target.value === "" ? undefined : Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select 
                value={gender || ""}
                onValueChange={(value) => setGender(value as Gender)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-full">
              <Label htmlFor="activityLevel">Activity Level</Label>
              <Select 
                value={activityLevel}
                onValueChange={(value) => setActivityLevel(value as ActivityLevel)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select activity level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                  <SelectItem value="lightly_active">Lightly active (light exercise 1-3 days/week)</SelectItem>
                  <SelectItem value="moderately_active">Moderately active (moderate exercise 3-5 days/week)</SelectItem>
                  <SelectItem value="very_active">Very active (hard exercise 6-7 days/week)</SelectItem>
                  <SelectItem value="extremely_active">Extremely active (very hard exercise & physical job)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
            <p className="text-sm text-muted-foreground">
              Adding your measurements helps us provide more accurate nutritional recommendations 
              tailored to your specific needs.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="password" className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Button type="submit" className="w-full md:w-auto bg-green-600 hover:bg-green-700" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  )
}

