/*
Navicat SQL Server Data Transfer

Source Server         : 192.168.0.73
Source Server Version : 160000
Source Host           : 192.168.0.73:1433
Source Database       : BillPayment
Source Schema         : dbo

Target Server Type    : SQL Server
Target Server Version : 160000
File Encoding         : 65001

Date: 2026-08-14 09:20:46
*/


-- ----------------------------
-- Table structure for [dbo].[TB_MST_Province]
-- ----------------------------
DROP TABLE [dbo].[TB_MST_Province]
GO
CREATE TABLE [dbo].[TB_MST_Province] (
[Province_Code] nvarchar(45) NOT NULL ,
[Province_Name_TH] nvarchar(100) NULL ,
[Province_Name_EN] nvarchar(100) NULL ,
[Active] bit NULL ,
[Create_Date] datetime NULL ,
[Create_By] nvarchar(50) NULL 
)


GO

-- ----------------------------
-- Records of TB_MST_Province
-- ----------------------------
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'001', N' กรุงเทพมหานคร', N' Bangkok', N'1', N'2024-11-13 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'002', N' สมุทรปราการ   ', N' Samut Prakan', N'1', N'2024-11-14 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'003', N' นนทบุรี   ', N' Nonthaburi', N'1', N'2024-11-15 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'004', N' ปทุมธานี   ', N' Pathum Thani', N'1', N'2024-11-16 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'005', N' พระนครศรีอยุธยา   ', N' Phra Nakhon Si Ayutthaya', N'1', N'2024-11-17 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'006', N' อ่างทอง   ', N' Ang Thong', N'1', N'2024-11-18 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'007', N' ลพบุรี   ', N' Loburi', N'1', N'2024-11-19 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'008', N' สิงห์บุรี   ', N' Sing Buri', N'1', N'2024-11-20 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'009', N' ชัยนาท   ', N' Chai Nat', N'1', N'2024-11-21 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'010', N' สระบุรี', N' Saraburi', N'1', N'2024-11-22 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'011', N' ชลบุรี   ', N' Chon Buri', N'1', N'2024-11-23 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'012', N' ระยอง   ', N' Rayong', N'1', N'2024-11-24 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'013', N' จันทบุรี   ', N' Chanthaburi', N'1', N'2024-11-25 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'014', N' ตราด   ', N' Trat', N'1', N'2024-11-26 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'015', N' ฉะเชิงเทรา   ', N' Chachoengsao', N'1', N'2024-11-27 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'016', N' ปราจีนบุรี   ', N' Prachin Buri', N'1', N'2024-11-28 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'017', N' นครนายก   ', N' Nakhon Nayok', N'1', N'2024-11-29 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'018', N' สระแก้ว   ', N' Sa Kaeo', N'1', N'2024-11-30 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'019', N' นครราชสีมา   ', N' Nakhon Ratchasima', N'1', N'2024-12-01 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'020', N' บุรีรัมย์   ', N' Buri Ram', N'1', N'2024-12-02 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'021', N' สุรินทร์   ', N' Surin', N'1', N'2024-12-03 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'022', N' ศรีสะเกษ   ', N' Si Sa Ket', N'1', N'2024-12-04 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'023', N' อุบลราชธานี   ', N' Ubon Ratchathani', N'1', N'2024-12-05 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'024', N' ยโสธร   ', N' Yasothon', N'1', N'2024-12-06 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'025', N' ชัยภูมิ   ', N' Chaiyaphum', N'1', N'2024-12-07 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'026', N' อำนาจเจริญ   ', N' Amnat Charoen', N'1', N'2024-12-08 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'027', N' บึงกาฬ', N' Buogkan', N'1', N'2024-12-09 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'028', N' หนองบัวลำภู', N' Nong Bua Lam Phu', N'1', N'2024-12-10 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'029', N' ขอนแก่น', N' Khon Kaen', N'1', N'2024-12-11 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'030', N' อุดรธานี', N' Udon Thani', N'1', N'2024-12-12 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'031', N' เลย', N' Loei', N'1', N'2024-12-13 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'032', N' หนองคาย', N' Nong Khai', N'1', N'2024-12-14 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'033', N' มหาสารคาม', N' Maha Sarakham', N'1', N'2024-12-15 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'034', N' ร้อยเอ็ด', N' Roi Et', N'1', N'2024-12-16 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'035', N' กาฬสินธุ์', N' Kalasin', N'1', N'2024-12-17 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'036', N' สกลนคร', N' Sakon Nakhon', N'1', N'2024-12-18 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'037', N' นครพนม', N' Nakhon Phanom', N'1', N'2024-12-19 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'038', N' มุกดาหาร', N' Mukdahan', N'1', N'2024-12-20 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'039', N' เชียงใหม่', N' Chiang Mai', N'1', N'2024-12-21 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'040', N' ลำพูน', N' Lamphun', N'1', N'2024-12-22 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'041', N' ลำปาง', N' Lampang', N'1', N'2024-12-23 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'042', N' อุตรดิตถ์', N' Uttaradit', N'1', N'2024-12-24 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'043', N' แพร่', N' Phrae', N'1', N'2024-12-25 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'044', N' น่าน', N' Nan', N'1', N'2024-12-26 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'045', N' พะเยา', N' Phayao', N'1', N'2024-12-27 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'046', N' เชียงราย', N' Chiang Rai', N'1', N'2024-12-28 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'047', N' แม่ฮ่องสอน', N' Mae Hong Son', N'1', N'2024-12-29 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'048', N' นครสวรรค์', N' Nakhon Sawan', N'1', N'2024-12-30 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'049', N' อุทัยธานี', N' Uthai Thani', N'1', N'2024-12-31 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'050', N' กำแพงเพชร', N' Kamphaeng Phet', N'1', N'2025-01-01 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'051', N' ตาก', N' Tak', N'1', N'2025-01-02 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'052', N' สุโขทัย', N' Sukhothai', N'1', N'2025-01-03 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'053', N' พิษณุโลก', N' Phitsanulok', N'1', N'2025-01-04 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'054', N' พิจิตร', N' Phichit', N'1', N'2025-01-05 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'055', N' เพชรบูรณ์', N' Phetchabun', N'1', N'2025-01-06 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'056', N' ราชบุรี', N' Ratchaburi', N'1', N'2025-01-07 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'057', N' กาญจนบุรี', N' Kanchanaburi', N'1', N'2025-01-08 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'058', N' สุพรรณบุรี', N' Suphan Buri', N'1', N'2025-01-09 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'059', N' นครปฐม', N' Nakhon Pathom', N'1', N'2025-01-10 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'060', N' สมุทรสาคร', N' Samut Sakhon', N'1', N'2025-01-11 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'061', N' สมุทรสงคราม', N' Samut Songkhram', N'1', N'2025-01-12 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'062', N' เพชรบุรี', N' Phetchaburi', N'1', N'2025-01-13 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'063', N' ประจวบคีรีขันธ์', N' Prachuap Khiri Khan', N'1', N'2025-01-14 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'064', N' นครศรีธรรมราช', N' Nakhon Si Thammarat', N'1', N'2025-01-15 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'065', N' กระบี่', N' Krabi', N'1', N'2025-01-16 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'066', N' พังงา', N' Phangnga', N'1', N'2025-01-17 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'067', N' ภูเก็ต', N' Phuket', N'1', N'2025-01-18 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'068', N' สุราษฎร์ธานี', N' Surat Thani', N'1', N'2025-01-19 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'069', N' ระนอง', N' Ranong', N'1', N'2025-01-20 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'070', N' ชุมพร', N' Chumphon', N'1', N'2025-01-21 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'071', N' สงขลา', N' Songkhla', N'1', N'2025-01-22 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'072', N' สตูล', N' Satun', N'1', N'2025-01-23 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'073', N' ตรัง', N' Trang', N'1', N'2025-01-24 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'074', N' พัทลุง', N' Phatthalung', N'1', N'2025-01-25 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'075', N' ปัตตานี', N' Pattani', N'1', N'2025-01-26 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'076', N' ยะลา', N' Yala', N'1', N'2025-01-27 09:24:12.000', N'IT');
GO
INSERT INTO [dbo].[TB_MST_Province] ([Province_Code], [Province_Name_TH], [Province_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'077', N' นราธิวาส', N' Narathiwat', N'1', N'2025-01-28 09:24:12.000', N'IT');
GO

-- ----------------------------
-- Indexes structure for table TB_MST_Province
-- ----------------------------

-- ----------------------------
-- Primary Key structure for table [dbo].[TB_MST_Province]
-- ----------------------------
ALTER TABLE [dbo].[TB_MST_Province] ADD PRIMARY KEY ([Province_Code])
GO
