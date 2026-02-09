import { RequestHandler } from "express";
import { db } from "../lib/db";

interface Package {
  id: string;
  name: string;
  gold_coins: number;
  bonus_sweep_coins: number;
  price: number;
  original_price: number;
  icon: string;
  color: string;
  is_popular: boolean;
  is_best_value: boolean;
  features: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
}

// Initialize packages table
async function initializePackagesTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS packages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        gold_coins INTEGER NOT NULL,
        bonus_sweep_coins INTEGER NOT NULL,
        price NUMERIC NOT NULL,
        original_price NUMERIC,
        icon VARCHAR(255),
        color VARCHAR(50),
        is_popular BOOLEAN DEFAULT false,
        is_best_value BOOLEAN DEFAULT false,
        features JSONB DEFAULT '[]',
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS package_sales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        package_id UUID REFERENCES packages(id),
        user_id UUID REFERENCES users(id),
        amount_paid NUMERIC NOT NULL,
        gold_coins_received INTEGER NOT NULL,
        sweep_coins_received INTEGER NOT NULL,
        payment_method VARCHAR(50),
        status VARCHAR(50) DEFAULT 'completed',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_package_sales_user_id ON package_sales(user_id);
      CREATE INDEX IF NOT EXISTS idx_package_sales_status ON package_sales(status);
    `);

    // Seed default packages if they don't exist
    const result = await db.query("SELECT COUNT(*) as count FROM packages");
    if (parseInt(result.rows[0].count) === 0) {
      const defaultPackages = [
        {
          name: "Starter Pack",
          gold_coins: 100,
          bonus_sweep_coins: 50,
          price: 4.99,
          original_price: null,
          icon: "Zap",
          color: "from-blue-500 to-blue-600",
          is_popular: false,
          is_best_value: false,
          features: ["100 Gold Coins", "50 Free Sweep Coins", "Welcome Bonus"],
          display_order: 1,
        },
        {
          name: "Popular Pack",
          gold_coins: 500,
          bonus_sweep_coins: 250,
          price: 19.99,
          original_price: 24.99,
          icon: "Crown",
          color: "from-purple-500 to-purple-600",
          is_popular: true,
          is_best_value: false,
          features: ["500 Gold Coins", "250 Free Sweep Coins", "25% Bonus"],
          display_order: 2,
        },
        {
          name: "Premium Pack",
          gold_coins: 1500,
          bonus_sweep_coins: 750,
          price: 49.99,
          original_price: 59.99,
          icon: "Crown",
          color: "from-amber-400 to-amber-600",
          is_popular: false,
          is_best_value: true,
          features: ["1500 Gold Coins", "750 Free Sweep Coins", "33% Bonus", "Exclusive Rewards"],
          display_order: 3,
        },
        {
          name: "Mega Pack",
          gold_coins: 5000,
          bonus_sweep_coins: 2500,
          price: 99.99,
          original_price: 129.99,
          icon: "Rocket",
          color: "from-red-500 to-red-600",
          is_popular: false,
          is_best_value: false,
          features: ["5000 Gold Coins", "2500 Free Sweep Coins", "50% Bonus", "VIP Treatment"],
          display_order: 4,
        },
      ];

      for (const pkg of defaultPackages) {
        await db.query(
          `INSERT INTO packages (name, gold_coins, bonus_sweep_coins, price, original_price, icon, color, is_popular, is_best_value, features, display_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            pkg.name,
            pkg.gold_coins,
            pkg.bonus_sweep_coins,
            pkg.price,
            pkg.original_price,
            pkg.icon,
            pkg.color,
            pkg.is_popular,
            pkg.is_best_value,
            JSON.stringify(pkg.features),
            pkg.display_order,
          ],
        );
      }
    }
  } catch (error) {
    console.error("Error initializing packages table:", error);
  }
}

export const initPackagesDB = initializePackagesTable;

// Get all packages
export const getPackages: RequestHandler = async (req: any, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM packages WHERE is_active = true ORDER BY display_order ASC",
    );
    const packages = result.rows.map((row: any) => ({
      ...row,
      features: typeof row.features === "string" ? JSON.parse(row.features) : row.features,
    }));
    res.json({ packages });
  } catch (error) {
    console.error("Get packages error:", error);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
};

// Get all packages (admin)
export const getPackagesAdmin: RequestHandler = async (req: any, res) => {
  try {
    const result = await db.query("SELECT * FROM packages ORDER BY display_order ASC");
    const packages = result.rows.map((row: any) => ({
      ...row,
      features: typeof row.features === "string" ? JSON.parse(row.features) : row.features,
    }));
    res.json({ packages });
  } catch (error) {
    console.error("Get packages admin error:", error);
    res.status(500).json({ error: "Failed to fetch packages" });
  }
};

// Create package
export const createPackage: RequestHandler = async (req: any, res) => {
  try {
    const {
      name,
      goldCoins,
      bonusSweepCoins,
      price,
      originalPrice,
      icon,
      color,
      isPopular,
      isBestValue,
      features,
      displayOrder,
    } = req.body;

    if (!name || goldCoins === undefined || price === undefined) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await db.query(
      `INSERT INTO packages (name, gold_coins, bonus_sweep_coins, price, original_price, icon, color, is_popular, is_best_value, features, display_order)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        name,
        goldCoins,
        bonusSweepCoins,
        price,
        originalPrice || null,
        icon || "Gift",
        color || "from-blue-500 to-blue-600",
        isPopular || false,
        isBestValue || false,
        JSON.stringify(features || []),
        displayOrder || 0,
      ],
    );

    const pkg = {
      ...result.rows[0],
      features: result.rows[0].features,
    };

    res.json({ package: pkg });
  } catch (error) {
    console.error("Create package error:", error);
    res.status(500).json({ error: "Failed to create package" });
  }
};

// Update package
export const updatePackage: RequestHandler = async (req: any, res) => {
  try {
    const { packageId } = req.params;
    const {
      name,
      goldCoins,
      bonusSweepCoins,
      price,
      originalPrice,
      icon,
      color,
      isPopular,
      isBestValue,
      features,
      isActive,
      displayOrder,
    } = req.body;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (goldCoins !== undefined) {
      updates.push(`gold_coins = $${paramIndex++}`);
      values.push(goldCoins);
    }
    if (bonusSweepCoins !== undefined) {
      updates.push(`bonus_sweep_coins = $${paramIndex++}`);
      values.push(bonusSweepCoins);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    if (originalPrice !== undefined) {
      updates.push(`original_price = $${paramIndex++}`);
      values.push(originalPrice);
    }
    if (icon !== undefined) {
      updates.push(`icon = $${paramIndex++}`);
      values.push(icon);
    }
    if (color !== undefined) {
      updates.push(`color = $${paramIndex++}`);
      values.push(color);
    }
    if (isPopular !== undefined) {
      updates.push(`is_popular = $${paramIndex++}`);
      values.push(isPopular);
    }
    if (isBestValue !== undefined) {
      updates.push(`is_best_value = $${paramIndex++}`);
      values.push(isBestValue);
    }
    if (features !== undefined) {
      updates.push(`features = $${paramIndex++}`);
      values.push(JSON.stringify(features));
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }
    if (displayOrder !== undefined) {
      updates.push(`display_order = $${paramIndex++}`);
      values.push(displayOrder);
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      return res.status(400).json({ error: "No fields to update" });
    }

    values.push(packageId);
    const query = `UPDATE packages SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Package not found" });
    }

    const pkg = {
      ...result.rows[0],
      features: result.rows[0].features,
    };

    res.json({ package: pkg });
  } catch (error) {
    console.error("Update package error:", error);
    res.status(500).json({ error: "Failed to update package" });
  }
};

// Delete package
export const deletePackage: RequestHandler = async (req: any, res) => {
  try {
    const { packageId } = req.params;

    await db.query("DELETE FROM packages WHERE id = $1", [packageId]);
    res.json({ success: true, message: "Package deleted" });
  } catch (error) {
    console.error("Delete package error:", error);
    res.status(500).json({ error: "Failed to delete package" });
  }
};

// Get package sales stats
export const getPackageSalesStats: RequestHandler = async (req: any, res) => {
  try {
    const totalSalesResult = await db.query(
      "SELECT COUNT(*) as count, SUM(amount_paid) as revenue FROM package_sales WHERE status = 'completed'",
    );

    const topPackagesResult = await db.query(
      `SELECT p.name, COUNT(ps.id) as sales_count, SUM(ps.amount_paid) as revenue
       FROM package_sales ps
       JOIN packages p ON ps.package_id = p.id
       WHERE ps.status = 'completed'
       GROUP BY p.id, p.name
       ORDER BY sales_count DESC
       LIMIT 5`,
    );

    res.json({
      stats: {
        totalSales: parseInt(totalSalesResult.rows[0].count),
        totalRevenue: parseFloat(totalSalesResult.rows[0].revenue || 0),
        topPackages: topPackagesResult.rows,
      },
    });
  } catch (error) {
    console.error("Get package sales stats error:", error);
    res.status(500).json({ error: "Failed to fetch sales stats" });
  }
};
