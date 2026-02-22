import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {

    employeeId: {
      type: String,
      required: true,
      unique: true,
    },

    employeeNumber: {
      type: String,
      required: true,
      unique: true,
    },
    
    employeeName: { type: String, required: true, trim: true },
    employeeEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["problem_manager", "moderator", "support"],
      default: "support",
    },

    permissions: {
      manageProblems: { type: Boolean, default: false },
      manageTestcases: { type: Boolean, default: false },
      manageUsers: { type: Boolean, default: false },
      manageDiscussions: { type: Boolean, default: false },
      viewSubmissions: { type: Boolean, default: false },
      deleteSubmissions: { type: Boolean, default: false },
    },

    joinedAt: { type: Date, default: Date.now },

    isActive: { type: Boolean, default: true },
    lastActive: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
