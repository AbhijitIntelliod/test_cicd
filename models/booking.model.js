module.exports = (sequelize, DataTypes) => {
    const Booking = sequelize.define('Booking', {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      fullName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false
      },
      date: {
        type: DataTypes.STRING,
        allowNull: false
      },
      time: {
        type: DataTypes.STRING, // or TIME if supported
        allowNull: false
      },
      guests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true
      }
    }, {
      tableName: "bookings",
      timestamps: true
    });
  
    return Booking;
  };