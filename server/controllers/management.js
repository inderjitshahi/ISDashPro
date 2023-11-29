import mongoose from "mongoose";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";

export const getAdmins = async (req, res) => {
  try {
    const admins = await User.find({ role: "admin" }).select("-password");
    res.status(200).json(admins);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const getUserPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    // Aggregate pipeline to get user document with associated affiliateStats
    const userWithStats = await User.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "affiliatestats",
          localField: "_id",
          foreignField: "userId",
          as: "affiliateStats",
        },
      },
      { $unwind: "$affiliateStats" }, // Deconstruct the array field created by the $lookup stage (affiliateStats).
    ]);

    // Fetch sale transactions for each affiliateSale ID
    const saleTransactions = await Promise.all(
      userWithStats[0].affiliateStats.affiliateSales.map((id) => {
        return Transaction.findById(id);
      })
    );

    // Filter out null transactions (if any)
    const filteredSaleTransactions = saleTransactions.filter(
      (transaction) => transaction !== null
    );

    // Respond with user document and filtered sale transactions
    res
      .status(200)
      .json({ user: userWithStats[0], sales: filteredSaleTransactions });
  } catch (error) {
    // Handle errors
    res.status(404).json({ message: error.message });
  }
};

