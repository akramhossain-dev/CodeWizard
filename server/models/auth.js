import mongoose from "mongoose";

const authSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: function() { return this.authProvider === 'local'; } },

    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    isVerified: { type: Boolean, default: false },

    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },

    googleId: { type: String, sparse: true, unique: true },

    isBanned: { type: Boolean, default: false },

    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },

    dateOfBirth: { type: Date, required: true },

    location: { type: String, trim: true },

    bio: { type: String, maxlength: 500, trim: true },

    profilePicture: { type: String, default: "" },

    socialLinks: {
      website: { type: String, default: "" },
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" },
      twitter: { type: String, default: "" },
    },

    work: {
      company: { type: String, trim: true },
      position: { type: String, trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      present: { type: Boolean, default: false },
    },

    education: {
      institution: { type: String, trim: true },
      degree: { type: String, trim: true },
      fieldOfStudy: { type: String, trim: true },
      startDate: { type: Date },
      endDate: { type: Date },
      present: { type: Boolean, default: false },
    },

    skills: [{ type: String, trim: true }],
    interests: [{ type: String, trim: true }],

    stats: {
      solved: { type: Number, default: 0 },
      attempted: { type: Number, default: 0 },
      easySolved: { type: Number, default: 0 },
      mediumSolved: { type: Number, default: 0 },
      hardSolved: { type: Number, default: 0 },
    },

    rating: { type: Number, default: 0 },
    rank: { type: Number, default: 0 },

    lastLogin: { type: Date },
  },
  { timestamps: true }
);

const Auth = mongoose.model("Auth", authSchema);

export default Auth;
