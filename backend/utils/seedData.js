/**
 * Comprehensive Database Seed Script
 * Generates 30 detailed products in every category (180 products total)
 * Usage: node utils/seedData.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Product  = require('../models/Product');
const User     = require('../models/User');

const categoriesData = {
  'Electronics': [
    { name: 'Samsung Galaxy S24 Ultra 5G', brand: 'Samsung', price: 129999, originalPrice: 144999, discount: 10, img: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=600' },
    { name: 'Apple iPhone 15 Pro Max 256GB', brand: 'Apple', price: 148900, originalPrice: 159900, discount: 7, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600' },
    { name: 'Apple MacBook Air M3 15-inch', brand: 'Apple', price: 134900, originalPrice: 149900, discount: 10, img: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600' },
    { name: 'Dell XPS 13 Plus OLED Touch', brand: 'Dell', price: 142990, originalPrice: 169990, discount: 16, img: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=600' },
    { name: 'Sony WH-1000XM5 Wireless Headphones', brand: 'Sony', price: 26990, originalPrice: 34990, discount: 23, img: 'https://images.unsplash.com/photo-1618366712010-f4ae9c647dcb?w=600' },
    { name: 'Apple AirPods Pro (2nd Gen) USB-C', brand: 'Apple', price: 20990, originalPrice: 24900, discount: 16, img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600' },
    { name: 'LG 55-inch 4K OLED Smart TV evo', brand: 'LG', price: 89999, originalPrice: 119999, discount: 25, img: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600' },
    { name: 'Sony Bravia 65-inch 4K HDR Google TV', brand: 'Sony', price: 104990, originalPrice: 139990, discount: 25, img: 'https://images.unsplash.com/photo-1593784991095-a205069470b6?w=600' },
    { name: 'Apple iPad Pro 13-inch M4 OLED', brand: 'Apple', price: 129900, originalPrice: 139900, discount: 7, img: 'https://images.unsplash.com/photo-1585155770447-2f66e2a397b5?w=600' },
    { name: 'Samsung Galaxy Tab S9 Ultra', brand: 'Samsung', price: 98999, originalPrice: 114999, discount: 14, img: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=600' },
    { name: 'Sony PlayStation 5 Slim Console', brand: 'Sony', price: 44990, originalPrice: 54990, discount: 18, img: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=600' },
    { name: 'Xbox Series X 1TB Gaming Console', brand: 'Microsoft', price: 47990, originalPrice: 55990, discount: 14, img: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=600' },
    { name: 'Canon EOS R6 Mark II Mirrorless Camera', brand: 'Canon', price: 199990, originalPrice: 224990, discount: 11, img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600' },
    { name: 'Sony Alpha 7 IV Full-Frame Camera', brand: 'Sony', price: 209990, originalPrice: 239990, discount: 13, img: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600' },
    { name: 'Apple Watch Ultra 2 GPS + Cellular', brand: 'Apple', price: 79900, originalPrice: 89900, discount: 11, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600' },
    { name: 'Samsung Galaxy Watch 6 Classic 47mm', brand: 'Samsung', price: 32999, originalPrice: 40999, discount: 20, img: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600' },
    { name: 'Bose QuietComfort Ultra Soundbar', brand: 'Bose', price: 79900, originalPrice: 99900, discount: 20, img: 'https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600' },
    { name: 'JBL Boombox 3 Wi-Fi Portable Speaker', brand: 'JBL', price: 39999, originalPrice: 49999, discount: 20, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600' },
    { name: 'ASUS ROG Zephyrus G16 Gaming Laptop', brand: 'ASUS', price: 179990, originalPrice: 219990, discount: 18, img: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?w=600' },
    { name: 'Logitech MX Master 3S Wireless Mouse', brand: 'Logitech', price: 8495, originalPrice: 10995, discount: 23, img: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600' },
    { name: 'Logitech MX Mechanical Wireless Keyboard', brand: 'Logitech', price: 13995, originalPrice: 17495, discount: 20, img: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600' },
    { name: 'Anker 737 Power Bank 24,000mAh 140W', brand: 'Anker', price: 11999, originalPrice: 14999, discount: 20, img: 'https://images.unsplash.com/photo-1609081219090-a6d81d3085bf?w=600' },
    { name: 'SanDisk 2TB Extreme Portable SSD USB 3.2', brand: 'SanDisk', price: 14999, originalPrice: 22999, discount: 35, img: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600' },
    { name: 'OnePlus 12 5G 16GB RAM 512GB', brand: 'OnePlus', price: 64999, originalPrice: 69999, discount: 7, img: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600' },
    { name: 'Nothing Phone (2) 5G 256GB White', brand: 'Nothing', price: 36999, originalPrice: 44999, discount: 18, img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600' },
    { name: 'GoPro HERO12 Black Action Camera', brand: 'GoPro', price: 37990, originalPrice: 45000, discount: 16, img: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600' },
    { name: 'DJI Mini 4 Pro Fly More Combo Drone', brand: 'DJI', price: 94990, originalPrice: 112990, discount: 16, img: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600' },
    { name: 'Kindle Paperwhite Signature Edition 32GB', brand: 'Amazon', price: 15499, originalPrice: 17999, discount: 14, img: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600' },
    { name: 'BenQ MOBIUZ 27" 165Hz QHD Gaming Monitor', brand: 'BenQ', price: 24990, originalPrice: 32990, discount: 24, img: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=600' },
    { name: 'Sennheiser Momentum 4 Wireless ANC', brand: 'Sennheiser', price: 24990, originalPrice: 34990, discount: 29, img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=600' }
  ],

  'Fashion': [
    { name: "Men's Italian Wool Slim-Fit 3-Piece Suit", brand: 'Raymond', price: 11999, originalPrice: 19999, discount: 40, img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600' },
    { name: "Women's Pure Silk Kanjeevaram Saree", brand: 'FabIndia', price: 7999, originalPrice: 14999, discount: 47, img: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600' },
    { name: "Levi's Men's 511 Slim Fit Stretch Jeans", brand: "Levi's", price: 2799, originalPrice: 4299, discount: 35, img: 'https://images.unsplash.com/photo-1542272604-780c96856592?w=600' },
    { name: "Tommy Hilfiger Men's Oxford Cotton Shirt", brand: 'Tommy Hilfiger', price: 3499, originalPrice: 5999, discount: 42, img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600' },
    { name: "Zara Women's Oversized Wool Blend Coat", brand: 'Zara', price: 6990, originalPrice: 9990, discount: 30, img: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=600' },
    { name: "Nike Air Force 1 '07 Classic White", brand: 'Nike', price: 7495, originalPrice: 8995, discount: 17, img: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600' },
    { name: 'Adidas Originals Superstar Leather Sneakers', brand: 'Adidas', price: 6599, originalPrice: 8999, discount: 27, img: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600' },
    { name: 'Fossil Grant Chronograph Leather Watch', brand: 'Fossil', price: 9495, originalPrice: 14995, discount: 37, img: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600' },
    { name: 'Michael Kors Jet Set Large Leather Tote', brand: 'Michael Kors', price: 14999, originalPrice: 24999, discount: 40, img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600' },
    { name: 'Ray-Ban Aviator Classic Polarized Sunglasses', brand: 'Ray-Ban', price: 7890, originalPrice: 10490, discount: 25, img: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600' },
    { name: "Puma Men's Training Tracksuit 2-Piece", brand: 'Puma', price: 3299, originalPrice: 5499, discount: 40, img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600' },
    { name: "Women's Floral Tiered Chiffon Maxi Dress", brand: 'H&M', price: 2299, originalPrice: 3999, discount: 43, img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600' },
    { name: "Woodland Men's Camel Leather Hiking Boots", brand: 'Woodland', price: 4495, originalPrice: 6995, discount: 36, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' },
    { name: "Allen Solly Men's Casual Chino Trousers", brand: 'Allen Solly', price: 1599, originalPrice: 2799, discount: 43, img: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600' },
    { name: 'Calvin Klein Genuine Leather Bifold Wallet', brand: 'Calvin Klein', price: 2999, originalPrice: 4999, discount: 40, img: 'https://images.unsplash.com/photo-1627123424574-724758594e93?w=600' },
    { name: "Titan Raga Viva Rose Gold Women's Watch", brand: 'Titan', price: 4995, originalPrice: 7495, discount: 33, img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600' },
    { name: 'Wildcraft 45L Adventure Rucksack Backpack', brand: 'Wildcraft', price: 2899, originalPrice: 4599, discount: 37, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600' },
    { name: "Biba Women's Embroidered Anarkali Kurta Set", brand: 'Biba', price: 3499, originalPrice: 6999, discount: 50, img: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600' },
    { name: "Vans Old Skool Canvas Skate Sneakers", brand: 'Vans', price: 4299, originalPrice: 5499, discount: 22, img: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600' },
    { name: "Peter England Men's Formal Blazer Jacket", brand: 'Peter England', price: 3999, originalPrice: 6999, discount: 43, img: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600' },
    { name: "W for Woman Printed Straight Cotton Kurta", brand: 'W', price: 1199, originalPrice: 2299, discount: 48, img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600' },
    { name: "Clarks Men's Leather Derby Formal Shoes", brand: 'Clarks', price: 4999, originalPrice: 7999, discount: 38, img: 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=600' },
    { name: "Casio G-Shock Matte Black Digital Watch", brand: 'Casio', price: 6995, originalPrice: 8995, discount: 22, img: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600' },
    { name: "Superdry Men's Vintage Logo Cotton Hoodie", brand: 'Superdry', price: 3799, originalPrice: 5999, discount: 37, img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600' },
    { name: "Lavie Women's Satchel Handbag with Pouch", brand: 'Lavie', price: 1899, originalPrice: 3999, discount: 53, img: 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=600' },
    { name: "American Tourister 3-Piece Luggage Trolley", brand: 'American Tourister', price: 8999, originalPrice: 17999, discount: 50, img: 'https://images.unsplash.com/photo-1565026057447-bc90a3dceb87?w=600' },
    { name: "United Colors of Benetton Cotton Polo", brand: 'UCB', price: 1299, originalPrice: 2199, discount: 41, img: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=600' },
    { name: "Bata Men's Handcrafted Leather Sandals", brand: 'Bata', price: 999, originalPrice: 1699, discount: 41, img: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600' },
    { name: "Manyavar Men's Jacquard Kurta Pajama Set", brand: 'Manyavar', price: 3999, originalPrice: 5999, discount: 33, img: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=600' },
    { name: "Forever 21 Women's High-Rise Denim Shorts", brand: 'Forever 21', price: 999, originalPrice: 1799, discount: 44, img: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600' }
  ],

  'Home & Kitchen': [
    { name: 'Instant Pot Duo Plus 9-in-1 Smart Cooker', brand: 'Instant Pot', price: 8499, originalPrice: 11999, discount: 29, img: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=600' },
    { name: 'Dyson V15 Detect Cordless Vacuum Cleaner', brand: 'Dyson', price: 52900, originalPrice: 62900, discount: 16, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' },
    { name: 'Philips Digital Air Fryer XL with Rapid Air', brand: 'Philips', price: 8999, originalPrice: 12995, discount: 31, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600' },
    { name: 'Prestige Iris 750 Watt Mixer Grinder 4 Jars', brand: 'Prestige', price: 2999, originalPrice: 4795, discount: 37, img: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600' },
    { name: 'Morphy Richards Espresso & Cappuccino Maker', brand: 'Morphy Richards', price: 7499, originalPrice: 10995, discount: 32, img: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=600' },
    { name: 'Havells Meditate Air Purifier with HEPA', brand: 'Havells', price: 16999, originalPrice: 24990, discount: 32, img: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600' },
    { name: 'Hawkins Futura Hard Anodized Cookware Set', brand: 'Hawkins', price: 4299, originalPrice: 6100, discount: 30, img: 'https://images.unsplash.com/photo-1584990347449-39b4bfa4d809?w=600' },
    { name: 'Cello Opalware Imperial 33-Piece Dinner Set', brand: 'Cello', price: 2199, originalPrice: 3999, discount: 45, img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600' },
    { name: 'Milton Thermosteel 1000ml Hot & Cold Flask', brand: 'Milton', price: 849, originalPrice: 1195, discount: 29, img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600' },
    { name: 'Wakefit Orthopedic Memory Foam King Mattress', brand: 'Wakefit', price: 11499, originalPrice: 16999, discount: 32, img: 'https://images.unsplash.com/photo-1584132967334-10e028bd69f7?w=600' },
    { name: 'Solimo Engineered Wood 3-Door Wardrobe', brand: 'Solimo', price: 9999, originalPrice: 16999, discount: 41, img: 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=600' },
    { name: 'Borosil Stainless Steel Electric Kettle 1.8L', brand: 'Borosil', price: 1299, originalPrice: 1890, discount: 31, img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=600' },
    { name: 'Bajaj New Shakti 15L Storage Water Heater', brand: 'Bajaj', price: 5499, originalPrice: 8990, discount: 39, img: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d?w=600' },
    { name: 'KENT Grand Plus RO+UV Water Purifier', brand: 'KENT', price: 14499, originalPrice: 19500, discount: 26, img: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?w=600' },
    { name: 'Godrej 244L 3-Star Inverter Refrigerator', brand: 'Godrej', price: 23990, originalPrice: 31990, discount: 25, img: 'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600' },
    { name: 'IFB 7kg 5-Star Front Load Washing Machine', brand: 'IFB', price: 28990, originalPrice: 36990, discount: 22, img: 'https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=600' },
    { name: 'Voltas 1.5 Ton 3-Star Inverter Split AC', brand: 'Voltas', price: 32990, originalPrice: 47990, discount: 31, img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600' },
    { name: 'Prestige 3-Burner Toughened Glass Gas Stove', brand: 'Prestige', price: 3499, originalPrice: 5995, discount: 42, img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600' },
    { name: 'Usha Fontana One Ceiling Fan with Underlight', brand: 'Usha', price: 4799, originalPrice: 6990, discount: 31, img: 'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=600' },
    { name: 'Story@Home 100% Cotton 300TC Double Bedsheet', brand: 'Story@Home', price: 999, originalPrice: 1999, discount: 50, img: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600' },
    { name: 'Pigeon Stainless Steel 5L Pressure Cooker', brand: 'Pigeon', price: 1199, originalPrice: 2195, discount: 45, img: 'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600' },
    { name: 'Wonderchef Royal Velvet Non-Stick Dosa Tawa', brand: 'Wonderchef', price: 799, originalPrice: 1500, discount: 47, img: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600' },
    { name: 'Sleepyhead Ergonomic High Back Office Chair', brand: 'Sleepyhead', price: 6499, originalPrice: 10999, discount: 41, img: 'https://images.unsplash.com/photo-1580481077197-047f2ec2b55f?w=600' },
    { name: 'Tupperware Heritage 10-Piece Food Container', brand: 'Tupperware', price: 1499, originalPrice: 2499, discount: 40, img: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=600' },
    { name: 'Mi Smart LED Desk Lamp 1S with App Control', brand: 'Xiaomi', price: 2499, originalPrice: 3499, discount: 29, img: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=600' },
    { name: 'Philips EasySpeed Plus 2100W Steam Iron', brand: 'Philips', price: 1999, originalPrice: 2995, discount: 33, img: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600' },
    { name: 'Amazon Brand - Solimo 100% Cotton Bath Towel Set', brand: 'Solimo', price: 799, originalPrice: 1499, discount: 47, img: 'https://images.unsplash.com/photo-1616627547584-bf28cee262db?w=600' },
    { name: 'Syska 9W LED Smart Bulb RGB WiFi (Pack of 2)', brand: 'Syska', price: 899, originalPrice: 1798, discount: 50, img: 'https://images.unsplash.com/photo-1550985616-10810253b84d?w=600' },
    { name: 'Green Soul Monster Ultimate Gaming Ergonomic Chair', brand: 'Green Soul', price: 17990, originalPrice: 24990, discount: 28, img: 'https://images.unsplash.com/photo-1592478411213-6153e4ebc07d?w=600' },
    { name: 'Eufy RoboVac 15C Max Smart Robot Vacuum', brand: 'Anker Eufy', price: 14999, originalPrice: 22999, discount: 35, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600' }
  ],

  'Beauty & Health': [
    { name: 'The Ordinary Hyaluronic Acid 2% + B5 Serum', brand: 'The Ordinary', price: 799, originalPrice: 999, discount: 20, img: 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=600' },
    { name: 'Dyson Supersonic Hair Dryer Special Edition', brand: 'Dyson', price: 34900, originalPrice: 39900, discount: 13, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600' },
    { name: 'Dior Sauvage Eau De Parfum for Men 100ml', brand: 'Dior', price: 11500, originalPrice: 13500, discount: 15, img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600' },
    { name: 'Chanel Coco Mademoiselle Intense 50ml', brand: 'Chanel', price: 9800, originalPrice: 11900, discount: 18, img: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600' },
    { name: "L'Oreal Paris Revitalift 1.5% Hyaluronic Serum", brand: "L'Oreal", price: 699, originalPrice: 999, discount: 30, img: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600' },
    { name: 'Cetaphil Gentle Skin Cleanser for Sensitive Skin', brand: 'Cetaphil', price: 549, originalPrice: 699, discount: 21, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600' },
    { name: 'Philips Series 7000 Wet & Dry Electric Shaver', brand: 'Philips', price: 6499, originalPrice: 8995, discount: 28, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600' },
    { name: "Maybelline New York SuperStay Matte Ink Lipstick", brand: 'Maybelline', price: 449, originalPrice: 699, discount: 36, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600' },
    { name: 'Neutrogena Hydro Boost Water Gel Moisturizer', brand: 'Neutrogena', price: 899, originalPrice: 1150, discount: 22, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600' },
    { name: 'Oral-B iO Series 9 Electric Toothbrush', brand: 'Oral-B', price: 15999, originalPrice: 22999, discount: 30, img: 'https://images.unsplash.com/photo-1559591937-e105314051fa?w=600' },
    { name: 'Minimalist 10% Niacinamide Face Serum with Zinc', brand: 'Minimalist', price: 599, originalPrice: 699, discount: 14, img: 'https://images.unsplash.com/photo-1608248597359-07b1d40026e6?w=600' },
    { name: 'Forest Essentials Soundarya Radiance Cream 50g', brand: 'Forest Essentials', price: 5400, originalPrice: 6200, discount: 13, img: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=600' },
    { name: 'Clinique Moisture Surge 100H Auto-Replenishing', brand: 'Clinique', price: 2950, originalPrice: 3500, discount: 16, img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600' },
    { name: 'Biotique Bio Kelp Protein Shampoo for Hair Fall', brand: 'Biotique', price: 299, originalPrice: 450, discount: 34, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600' },
    { name: 'Gillette Fusion5 ProGlide Men Razor with 4 Blades', brand: 'Gillette', price: 1299, originalPrice: 1799, discount: 28, img: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600' },
    { name: 'Estee Lauder Advanced Night Repair Serum 50ml', brand: 'Estee Lauder', price: 8250, originalPrice: 9900, discount: 17, img: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=600' },
    { name: 'Mamaearth Onion Hair Oil for Hair Growth 250ml', brand: 'Mamaearth', price: 449, originalPrice: 599, discount: 25, img: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=600' },
    { name: 'Plum Green Tea Alcohol-Free Face Toner 200ml', brand: 'Plum', price: 349, originalPrice: 425, discount: 18, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600' },
    { name: 'Vega 3-in-1 Hair Styler (Straightener, Curler & Crimper)', brand: 'Vega', price: 1499, originalPrice: 2199, discount: 32, img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600' },
    { name: 'Himalaya Purifying Neem Face Wash 400ml', brand: 'Himalaya', price: 299, originalPrice: 399, discount: 25, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600' },
    { name: 'Sugar Cosmetics Matte As Hell Crayon Lipstick', brand: 'Sugar', price: 699, originalPrice: 849, discount: 18, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600' },
    { name: 'WOW Skin Science Apple Cider Vinegar Face Wash', brand: 'WOW', price: 349, originalPrice: 499, discount: 30, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600' },
    { name: 'Olay Total Effects 7 in One Anti-Ageing Day Cream', brand: 'Olay', price: 899, originalPrice: 1099, discount: 18, img: 'https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=600' },
    { name: 'Versace Eros Eau De Toilette For Men 100ml', brand: 'Versace', price: 7200, originalPrice: 8500, discount: 15, img: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600' },
    { name: 'Lakme Absolute Skin Gloss Gel Creme 50g', brand: 'Lakme', price: 499, originalPrice: 650, discount: 23, img: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600' },
    { name: 'Tresemme Keratin Smooth Shampoo & Conditioner Set', brand: 'Tresemme', price: 799, originalPrice: 1199, discount: 33, img: 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=600' },
    { name: 'Bombay Shaving Company 6-in-1 Grooming Kit', brand: 'Bombay Shaving', price: 1899, originalPrice: 2995, discount: 37, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600' },
    { name: 'Dot & Key Vitamin C + E Super Bright Sunscreen SPF50', brand: 'Dot & Key', price: 495, originalPrice: 595, discount: 17, img: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600' },
    { name: 'Beardo Godfather Beard Oil & Wash Combo', brand: 'Beardo', price: 699, originalPrice: 998, discount: 30, img: 'https://images.unsplash.com/photo-1621607512214-68297480165e?w=600' },
    { name: 'Nykaa Matte to Last Liquid Lipstick - Chai', brand: 'Nykaa', price: 549, originalPrice: 649, discount: 15, img: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=600' }
  ],

  'Sports': [
    { name: 'Nike Air Zoom Pegasus 40 Running Shoes', brand: 'Nike', price: 9995, originalPrice: 12995, discount: 23, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' },
    { name: 'Fitbit Charge 6 Advanced Fitness Tracker', brand: 'Fitbit', price: 14999, originalPrice: 19999, discount: 25, img: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=600' },
    { name: 'Garmin Forerunner 265 GPS Running Smartwatch', brand: 'Garmin', price: 44990, originalPrice: 52990, discount: 15, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600' },
    { name: 'Adidas Ultraboost Light Performance Sneakers', brand: 'Adidas', price: 13999, originalPrice: 18999, discount: 26, img: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600' },
    { name: 'Under Armour Men Tech 2.0 Short-Sleeve T-Shirt', brand: 'Under Armour', price: 1499, originalPrice: 2299, discount: 35, img: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=600' },
    { name: 'Yonex Astrox 99 Pro Badminton Racket (3U/G5)', brand: 'Yonex', price: 13490, originalPrice: 17990, discount: 25, img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=600' },
    { name: 'Wilson Pro Staff 97 v14 Tennis Racquet', brand: 'Wilson', price: 21999, originalPrice: 26999, discount: 19, img: 'https://images.unsplash.com/photo-1617083934555-563d6f1406e2?w=600' },
    { name: 'Decathlon Quechua 3-Person Waterproof Camping Tent', brand: 'Decathlon', price: 3499, originalPrice: 4999, discount: 30, img: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=600' },
    { name: 'Nivia Storm Football Size 5 FIFA Pro', brand: 'Nivia', price: 799, originalPrice: 1199, discount: 33, img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600' },
    { name: 'Kore PVC 20kg Adjustable Dumbbells & Rod Set', brand: 'Kore', price: 1899, originalPrice: 3499, discount: 46, img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600' },
    { name: 'Strauss Anti-Skid Yoga Mat with Carry Strap 6mm', brand: 'Strauss', price: 699, originalPrice: 1299, discount: 46, img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600' },
    { name: 'Hero Sprint Pro 21-Speed Mountain Bicycle 27.5T', brand: 'Hero', price: 13999, originalPrice: 19999, discount: 30, img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600' },
    { name: 'Speedo Fastskin Elite Swimming Goggles Mirror', brand: 'Speedo', price: 2499, originalPrice: 3499, discount: 29, img: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=600' },
    { name: 'SS Gladiator English Willow Grade 1 Cricket Bat', brand: 'SS', price: 18990, originalPrice: 24990, discount: 24, img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600' },
    { name: 'Spalding NBA Official Leather Game Basketball', brand: 'Spalding', price: 2999, originalPrice: 4299, discount: 30, img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600' },
    { name: 'Puma Men Running Zip-Up Jacket Windbreaker', brand: 'Puma', price: 2799, originalPrice: 4999, discount: 44, img: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600' },
    { name: 'CamelBak Podium Chill 710ml Insulated Cycle Bottle', brand: 'CamelBak', price: 1499, originalPrice: 1999, discount: 25, img: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600' },
    { name: 'Boldfit Resistance Loop Exercise Bands (Set of 5)', brand: 'Boldfit', price: 499, originalPrice: 999, discount: 50, img: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600' },
    { name: 'Cosco Light Tennis Cricket Ball (Pack of 12)', brand: 'Cosco', price: 899, originalPrice: 1200, discount: 25, img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600' },
    { name: 'Nike Elemental Training Backpack 21L Black', brand: 'Nike', price: 1995, originalPrice: 2795, discount: 29, img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600' },
    { name: 'Cultsport Smart Treadmill with Auto Incline 3HP', brand: 'Cultsport', price: 29999, originalPrice: 49999, discount: 40, img: 'https://images.unsplash.com/photo-1538805060514-97d9cc17730c?w=600' },
    { name: 'Kobo Cast Iron Kettlebell 16kg Hammer Tone', brand: 'Kobo', price: 2499, originalPrice: 3999, discount: 38, img: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600' },
    { name: 'Reebok Men Nano X3 Cross-Training Gym Shoes', brand: 'Reebok', price: 8999, originalPrice: 12999, discount: 31, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600' },
    { name: 'Everlast Pro Style Boxing Training Gloves 12oz', brand: 'Everlast', price: 2799, originalPrice: 3999, discount: 30, img: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=600' },
    { name: 'Fitkit 5-Piece Multipurpose Pushup & Dip Bars', brand: 'Fitkit', price: 799, originalPrice: 1499, discount: 47, img: 'https://images.unsplash.com/photo-1584735935682-2f2b69dff9d2?w=600' },
    { name: 'Vector X Skipping Jump Rope with Ball Bearings', brand: 'Vector X', price: 299, originalPrice: 499, discount: 40, img: 'https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600' },
    { name: 'Stiga Pro Carbon Table Tennis Ping Pong Racket', brand: 'Stiga', price: 4499, originalPrice: 5999, discount: 25, img: 'https://images.unsplash.com/photo-1534158914592-062992fbe900?w=600' },
    { name: 'SG Club Leather Cricket Ball White (Box of 6)', brand: 'SG', price: 2399, originalPrice: 3199, discount: 25, img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600' },
    { name: 'Fastrack Reflex Beat Plus Blood Pressure Smartwatch', brand: 'Fastrack', price: 1995, originalPrice: 3495, discount: 43, img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600' },
    { name: 'Decathlon Tarmak Adult Basketball Hoop Stand', brand: 'Decathlon', price: 11999, originalPrice: 16999, discount: 29, img: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600' }
  ],

  'Grocery': [
    { name: 'Happilo Premium California Almonds 1kg Value Pack', brand: 'Happilo', price: 849, originalPrice: 1299, discount: 35, img: 'https://images.unsplash.com/photo-1508061252966-f72fb4d2f099?w=600' },
    { name: 'Nutraj Royal Californian Whole Walnuts 1kg', brand: 'Nutraj', price: 999, originalPrice: 1599, discount: 38, img: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=600' },
    { name: 'Tata Tea Gold Leaf Premium Black Tea 1kg', brand: 'Tata Tea', price: 549, originalPrice: 650, discount: 16, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600' },
    { name: 'Nescafe Gold Blend Premium Instant Coffee 200g', brand: 'Nescafe', price: 799, originalPrice: 950, discount: 16, img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600' },
    { name: 'Dabur 100% Pure Organic Raw Honey 1kg', brand: 'Dabur', price: 399, originalPrice: 520, discount: 23, img: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600' },
    { name: 'Borges Extra Virgin Olive Oil Cold Pressed 1L', brand: 'Borges', price: 1199, originalPrice: 1650, discount: 27, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600' },
    { name: 'Ferrero Rocher Premium Hazelnut Chocolates 24 Pieces', brand: 'Ferrero', price: 899, originalPrice: 1099, discount: 18, img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600' },
    { name: 'Lindt Excellence 85% Cocoa Dark Chocolate 100g (Pack of 3)', brand: 'Lindt', price: 999, originalPrice: 1200, discount: 17, img: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=600' },
    { name: 'Kellogg’s Special K Whole Wheat Multigrain Cereal 900g', brand: 'Kellogg’s', price: 449, originalPrice: 540, discount: 17, img: 'https://images.unsplash.com/photo-1521483451569-e33803c0330c?w=600' },
    { name: 'Quaker Rolled Oats 100% Natural Wholegrain 1.5kg', brand: 'Quaker', price: 299, originalPrice: 395, discount: 24, img: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600' },
    { name: 'Daawat Ultima Extra Long Grain Basmati Rice 5kg', brand: 'Daawat', price: 949, originalPrice: 1250, discount: 24, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600' },
    { name: 'Fortune Sunlite Refined Sunflower Oil 5L Can', brand: 'Fortune', price: 699, originalPrice: 850, discount: 18, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600' },
    { name: 'Amul Pure Ghee 1L Tin Authentic Aroma', brand: 'Amul', price: 620, originalPrice: 680, discount: 9, img: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=600' },
    { name: 'Epigamia Greek Yogurt Strawberry & Mango (Pack of 6)', brand: 'Epigamia', price: 360, originalPrice: 420, discount: 14, img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600' },
    { name: 'Cadbury Celebrations Rich Dry Fruit Gift Box 450g', brand: 'Cadbury', price: 499, originalPrice: 650, discount: 23, img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600' },
    { name: 'Pintola All-Natural Crunchy Peanut Butter 1kg', brand: 'Pintola', price: 449, originalPrice: 599, discount: 25, img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600' },
    { name: 'True Elements 7-in-1 Super Seeds Mix (Chia, Flax, Pumpkin)', brand: 'True Elements', price: 349, originalPrice: 499, discount: 30, img: 'https://images.unsplash.com/photo-1508061252966-f72fb4d2f099?w=600' },
    { name: 'Twinings Green Tea with Lemon & Honey 100 Tea Bags', brand: 'Twinings', price: 599, originalPrice: 750, discount: 20, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600' },
    { name: 'Organic Tattva Organic Brown Basmati Rice 2kg', brand: 'Organic Tattva', price: 399, originalPrice: 520, discount: 23, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600' },
    { name: 'Saffola Gold Pro Healthy Cooking Oil 5L Pouch', brand: 'Saffola', price: 849, originalPrice: 1050, discount: 19, img: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600' },
    { name: 'Blue Tokai Coffee Roasters Vienna Roast Ground 250g', brand: 'Blue Tokai', price: 450, originalPrice: 520, discount: 13, img: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600' },
    { name: 'Drools Optimum Performance Adult Dry Dog Food 10kg', brand: 'Drools', price: 1699, originalPrice: 2299, discount: 26, img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600' },
    { name: 'Whiskas Ocean Fish Dry Cat Food 3kg with Vitamins', brand: 'Whiskas', price: 949, originalPrice: 1150, discount: 17, img: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?w=600' },
    { name: 'Nutella Hazelnut Cocoa Spread Jar 750g', brand: 'Ferrero Nutella', price: 629, originalPrice: 750, discount: 16, img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600' },
    { name: 'Real Activ 100% Mixed Fruit Juice 1L (Pack of 4)', brand: 'Real', price: 480, originalPrice: 600, discount: 20, img: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=600' },
    { name: 'Tata Sampann Unpolished Toor Dal 1kg', brand: 'Tata Sampann', price: 175, originalPrice: 210, discount: 17, img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600' },
    { name: 'Aashirvaad Select 100% Sharbati Whole Wheat Atta 5kg', brand: 'Aashirvaad', price: 349, originalPrice: 410, discount: 15, img: 'https://images.unsplash.com/photo-1586444248902-2f64eddc13df?w=600' },
    { name: 'Makhana Royal Grade A Fox Nuts Jumbo Roasted 500g', brand: 'Farmley', price: 549, originalPrice: 799, discount: 31, img: 'https://images.unsplash.com/photo-1508061252966-f72fb4d2f099?w=600' },
    { name: 'Kimia Dates Premium Fresh Iranian Dates 500g (Pack of 2)', brand: 'Kimia', price: 429, originalPrice: 650, discount: 34, img: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600' },
    { name: 'Hersheys Kisses Milk Chocolate Giant Bag 500g', brand: 'Hersheys', price: 499, originalPrice: 650, discount: 23, img: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600' }
  ]
};

const adminUser = {
  name:     'X-Mart Admin',
  email:    'admin@xmart.com',
  password: 'Admin@12345',
  role:     'admin',
  phone:    '+91 9999999999',
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('🟢  Connected to MongoDB Atlas');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({ email: adminUser.email });
    console.log('🗑️   Cleared existing products collection');

    // Create admin user
    await User.create(adminUser);
    console.log(`👤  Admin user verified: ${adminUser.email}`);

    // Build 180 rich products (30 per category)
    const allProducts = [];
    for (const [category, items] of Object.entries(categoriesData)) {
      items.forEach((item, index) => {
        const rating = Number((4.1 + (Math.random() * 0.8)).toFixed(1));
        const numReviews = Math.floor(45 + Math.random() * 850);
        const stock = Math.floor(15 + Math.random() * 120);
        const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 7);

        allProducts.push({
          name: item.name,
          slug,
          description: `Experience exceptional quality with the ${item.name} by ${item.brand}. Packed with advanced features, long-lasting durability, authentic manufacturer guarantee, and premium materials designed for everyday convenience.`,
          category,
          brand: item.brand,
          price: item.price,
          originalPrice: item.originalPrice,
          discount: item.discount,
          stock,
          images: [item.img],
          rating,
          numReviews,
          tags: [category.toLowerCase(), item.brand.toLowerCase(), 'bestseller', 'trending'],
          isFeatured: index < 6,
          warranty: '1 to 2 Years Manufacturer Warranty',
          deliveryInfo: 'Delivered in 2-4 business days with Prime Express',
          isActive: true
        });
      });
    }

    const created = await Product.insertMany(allProducts);
    console.log(`\n🎉  Successfully seeded ${created.length} products (30 products across all 6 categories)!`);
    console.log(`📦  Categories seeded: ${Object.keys(categoriesData).join(', ')}`);
    console.log('─────────────────────────────────────────\n');

    process.exit(0);
  } catch (err) {
    console.error('❌  Seed failed:', err.message);
    process.exit(1);
  }
}

seed();
