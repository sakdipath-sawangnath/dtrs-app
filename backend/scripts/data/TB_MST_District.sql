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

Date: 2026-08-14 09:21:03
*/


-- ----------------------------
-- Table structure for [dbo].[TB_MST_District]
-- ----------------------------
DROP TABLE [dbo].[TB_MST_District]
GO
CREATE TABLE [dbo].[TB_MST_District] (
[District_Code] nvarchar(45) NOT NULL ,
[Province_Code] nvarchar(45) NOT NULL ,
[District_Name_TH] nvarchar(100) NULL ,
[District_Name_EN] nvarchar(100) NULL ,
[Active] bit NULL ,
[Create_Date] datetime NULL ,
[Create_By] nvarchar(50) NULL 
)


GO

-- ----------------------------
-- Records of TB_MST_District
-- ----------------------------
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0001', N'001', N' พระนคร   ', N' Phra Nakhon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0002', N'001', N' ดุสิต   ', N' Dusit', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0003', N'001', N' หนองจอก   ', N' Nong Chok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0004', N'001', N' บางรัก   ', N' Bang Rak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0005', N'001', N' บางเขน   ', N' Bang Khen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0006', N'001', N' บางกะปิ   ', N' Bang Kapi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0007', N'001', N' ปทุมวัน   ', N' Pathum Wan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0008', N'001', N' ป้อมปราบศัตรูพ่าย   ', N' Pom Prap Sattru Phai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0009', N'001', N' พระโขนง   ', N' Phra Khanong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0010', N'001', N' มีนบุรี   ', N' Min Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0011', N'001', N' ลาดกระบัง   ', N' Lat Krabang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0012', N'001', N' ยานนาวา   ', N' Yan Nawa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0013', N'001', N' สัมพันธวงศ์   ', N' Samphanthawong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0014', N'001', N' พญาไท   ', N' Phaya Thai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0015', N'001', N' ธนบุรี   ', N' Thon Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0016', N'001', N' บางกอกใหญ่   ', N' Bangkok Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0017', N'001', N' ห้วยขวาง   ', N' Huai Khwang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0018', N'001', N' คลองสาน   ', N' Khlong San', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0019', N'001', N' ตลิ่งชัน   ', N' Taling Chan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0020', N'001', N' บางกอกน้อย   ', N' Bangkok Noi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0021', N'001', N' บางขุนเทียน   ', N' Bang Khun Thian', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0022', N'001', N' ภาษีเจริญ   ', N' Phasi Charoen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0023', N'001', N' หนองแขม   ', N' Nong Khaem', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0024', N'001', N' ราษฎร์บูรณะ   ', N' Rat Burana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0025', N'001', N' บางพลัด   ', N' Bang Phlat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0026', N'001', N' ดินแดง   ', N' Din Daeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0027', N'001', N' บึงกุ่ม   ', N' Bueng Kum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0028', N'001', N' สาทร   ', N' Sathon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0029', N'001', N' บางซื่อ   ', N' Bang Sue', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0030', N'001', N' จตุจักร   ', N' Chatuchak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0031', N'001', N' บางคอแหลม   ', N' Bang Kho Laem', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0032', N'001', N' ประเวศ   ', N' Prawet', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0033', N'001', N' คลองเตย   ', N' Khlong Toei', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0034', N'001', N' สวนหลวง   ', N' Suan Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0035', N'001', N' จอมทอง   ', N' Chom Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0036', N'001', N' ดอนเมือง   ', N' Don Mueang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0037', N'001', N'ราชเทวี', N'Ratchathewi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0038', N'001', N' ลาดพร้าว   ', N' Lat Phrao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0039', N'001', N' วัฒนา', N' Watthana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0040', N'001', N' บางแค   ', N' Bang Khae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0041', N'001', N' หลักสี่   ', N' Lak Si', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0042', N'001', N' สายไหม   ', N' Sai Mai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0043', N'001', N' คันนายาว   ', N' Khan Na Yao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0044', N'001', N' สะพานสูง   ', N' Saphan Sung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0045', N'001', N' วังทองหลาง   ', N' Wang Thonglang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0046', N'001', N' คลองสามวา   ', N' Khlong Sam Wa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0047', N'001', N' บางนา   ', N' Bang Na', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0048', N'001', N' ทวีวัฒนา   ', N' Thawi Watthana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0049', N'001', N' ทุ่งครุ   ', N' Thung Khru', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0050', N'001', N' บางบอน   ', N' Bang Bon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0051', N'002', N' เมืองสมุทรปราการ   ', N' Mueang Samut Prakan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0052', N'002', N' บางบ่อ   ', N' Bang Bo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0053', N'002', N' บางพลี   ', N' Bang Phli', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0054', N'002', N' พระประแดง   ', N' Phra Pradaeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0055', N'002', N' พระสมุทรเจดีย์   ', N' Phra Samut Chedi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0056', N'002', N' บางเสาธง   ', N' Bang Sao Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0057', N'003', N' เมืองนนทบุรี   ', N' Mueang Nonthaburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0058', N'003', N' บางกรวย   ', N' Bang Kruai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0059', N'003', N' บางใหญ่   ', N' Bang Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0060', N'003', N' บางบัวทอง   ', N' Bang Bua Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0061', N'003', N' ไทรน้อย   ', N' Sai Noi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0062', N'003', N' ปากเกร็ด   ', N' Pak Kret', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0063', N'004', N' เมืองปทุมธานี   ', N' Mueang Pathum Thani', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0064', N'004', N' คลองหลวง   ', N' Khlong Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0065', N'004', N' ธัญบุรี   ', N' Thanyaburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0066', N'004', N' หนองเสือ   ', N' Nong Suea', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0067', N'004', N' ลาดหลุมแก้ว   ', N' Lat Lum Kaeo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0068', N'004', N' ลำลูกกา   ', N' Lam Luk Ka', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0069', N'004', N' สามโคก   ', N' Sam Khok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0070', N'005', N' พระนครศรีอยุธยา   ', N' Phra Nakhon Si Ayutthaya', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0071', N'005', N' ท่าเรือ   ', N' Tha Ruea', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0072', N'005', N' นครหลวง   ', N' Nakhon Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0073', N'005', N' บางไทร   ', N' Bang Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0074', N'005', N' บางบาล   ', N' Bang Ban', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0075', N'005', N' บางปะอิน   ', N' Bang Pa-in', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0076', N'005', N' บางปะหัน   ', N' Bang Pahan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0077', N'005', N' ผักไห่   ', N' Phak Hai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0078', N'005', N' ภาชี   ', N' Phachi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0079', N'005', N' ลาดบัวหลวง   ', N' Lat Bua Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0080', N'005', N' วังน้อย   ', N' Wang Noi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0081', N'005', N' เสนา   ', N' Sena', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0082', N'005', N' บางซ้าย   ', N' Bang Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0083', N'005', N' อุทัย   ', N' Uthai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0084', N'005', N' มหาราช   ', N' Maha Rat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0085', N'005', N' บ้านแพรก   ', N' Ban Phraek', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0086', N'006', N' เมืองอ่างทอง   ', N' Mueang Ang Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0087', N'006', N' ไชโย   ', N' Chaiyo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0088', N'006', N' ป่าโมก   ', N' Pa Mok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0089', N'006', N' โพธิ์ทอง   ', N' Pho Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0090', N'006', N' แสวงหา   ', N' Sawaeng Ha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0091', N'006', N' วิเศษชัยชาญ   ', N' Wiset Chai Chan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0092', N'006', N' สามโก้   ', N' Samko', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0093', N'007', N' เมืองลพบุรี   ', N' Mueang Lop Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0094', N'007', N' พัฒนานิคม   ', N' Phatthana Nikhom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0095', N'007', N' โคกสำโรง   ', N' Khok Samrong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0096', N'007', N' ชัยบาดาล   ', N' Chai Badan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0097', N'007', N' ท่าวุ้ง   ', N' Tha Wung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0098', N'007', N' บ้านหมี่   ', N' Ban Mi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0099', N'007', N' ท่าหลวง   ', N' Tha Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0100', N'007', N' สระโบสถ์   ', N' Sa Bot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0101', N'007', N' โคกเจริญ   ', N' Khok Charoen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0102', N'007', N' ลำสนธิ   ', N' Lam Sonthi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0103', N'007', N' หนองม่วง   ', N' Nong Muang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0104', N'008', N' เมืองสิงห์บุรี   ', N' Mueang Sing Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0105', N'008', N' บางระจัน   ', N' Bang Rachan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0106', N'008', N' ค่ายบางระจัน   ', N' Khai Bang Rachan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0107', N'008', N' พรหมบุรี   ', N' Phrom Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0108', N'008', N' ท่าช้าง   ', N' Tha Chang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0109', N'008', N' อินทร์บุรี   ', N' In Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0110', N'009', N' เมืองชัยนาท   ', N' Mueang Chai Nat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0111', N'009', N' มโนรมย์   ', N' Manorom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0112', N'009', N' วัดสิงห์   ', N' Wat Sing', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0113', N'009', N' สรรพยา   ', N' Sapphaya', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0114', N'009', N' สรรคบุรี   ', N' Sankhaburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0115', N'009', N' หันคา   ', N' Hankha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0116', N'009', N' หนองมะโมง   ', N' Nong Mamong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0117', N'009', N' เนินขาม   ', N' Noen Kham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0118', N'010', N' เมืองสระบุรี   ', N' Mueang Saraburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0119', N'010', N' แก่งคอย   ', N' Kaeng Khoi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0120', N'010', N' หนองแค   ', N' Nong Khae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0121', N'010', N' วิหารแดง   ', N' Wihan Daeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0122', N'010', N' หนองแซง   ', N' Nong Saeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0123', N'010', N' บ้านหมอ   ', N' Ban Mo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0124', N'010', N' ดอนพุด   ', N' Don Phut', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0125', N'010', N' หนองโดน   ', N' Nong Don', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0126', N'010', N' พระพุทธบาท   ', N' Phra Phutthabat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0127', N'010', N' เสาไห้   ', N' Sao Hai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0128', N'010', N' มวกเหล็ก   ', N' Muak Lek', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0129', N'010', N' วังม่วง   ', N' Wang Muang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0130', N'010', N' เฉลิมพระเกียรติ   ', N' Chaloem Phra Kiat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0131', N'011', N' เมืองชลบุรี   ', N' Mueang Chon Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0132', N'011', N' บ้านบึง   ', N' Ban Bueng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0133', N'011', N' หนองใหญ่   ', N' Nong Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0134', N'011', N' บางละมุง   ', N' Bang Lamung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0135', N'011', N' พานทอง   ', N' Phan Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0136', N'011', N' พนัสนิคม   ', N' Phanat Nikhom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0137', N'011', N' ศรีราชา   ', N' Si Racha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0138', N'011', N' เกาะสีชัง   ', N' Ko Sichang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0139', N'011', N' สัตหีบ   ', N' Sattahip', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0140', N'011', N' บ่อทอง   ', N' Bo Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0141', N'011', N' เกาะจันทร์   ', N' Ko Chan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0142', N'012', N' เมืองระยอง   ', N' Mueang Rayong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0143', N'012', N' บ้านฉาง   ', N' Ban Chang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0144', N'012', N' แกลง   ', N' Klaeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0145', N'012', N' วังจันทร์   ', N' Wang Chan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0146', N'012', N' บ้านค่าย   ', N' Ban Khai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0147', N'012', N' ปลวกแดง   ', N' Pluak Daeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0148', N'012', N' เขาชะเมา   ', N' Khao Chamao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0149', N'012', N' นิคมพัฒนา   ', N' Nikhom Phatthana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0150', N'013', N' เมืองจันทบุรี   ', N' Mueang Chanthaburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0151', N'013', N' ขลุง   ', N' Khlung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0152', N'013', N' ท่าใหม่   ', N' Tha Mai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0153', N'013', N' โป่งน้ำร้อน   ', N' Pong Nam Ron', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0154', N'013', N' มะขาม   ', N' Makham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0155', N'013', N' แหลมสิงห์   ', N' Laem Sing', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0156', N'013', N' สอยดาว   ', N' Soi Dao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0157', N'013', N' แก่งหางแมว   ', N' Kaeng Hang Maeo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0158', N'013', N' นายายอาม   ', N' Na Yai Am', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0159', N'013', N' เขาคิชฌกูฏ   ', N' Khoa Khitchakut', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0160', N'014', N' เมืองตราด   ', N' Mueang Trat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0161', N'014', N' คลองใหญ่   ', N' Khlong Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0162', N'014', N' เขาสมิง   ', N' Khao Saming', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0163', N'014', N' บ่อไร่   ', N' Bo Rai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0164', N'014', N' แหลมงอบ   ', N' Laem Ngop', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0165', N'014', N' เกาะกูด   ', N' Ko Kut', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0166', N'014', N' เกาะช้าง   ', N' Ko Chang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0167', N'015', N' เมืองฉะเชิงเทรา   ', N' Mueang Chachoengsao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0168', N'015', N' บางคล้า   ', N' Bang Khla', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0169', N'015', N' บางน้ำเปรี้ยว   ', N' Bang Nam Priao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0170', N'015', N' บางปะกง   ', N' Bang Pakong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0171', N'015', N' บ้านโพธิ์   ', N' Ban Pho', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0172', N'015', N' พนมสารคาม   ', N' Phanom Sarakham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0173', N'015', N' ราชสาส์น   ', N' Ratchasan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0174', N'015', N' สนามชัยเขต  ', N' Sanam Chai Khet', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0175', N'015', N' แปลงยาว   ', N' Plaeng Yao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0176', N'015', N' ท่าตะเกียบ   ', N' Tha Takiap', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0177', N'015', N' คลองเขื่อน   ', N' Khlong Khuean', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0178', N'016', N' เมืองปราจีนบุรี   ', N' Mueang Prachin Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0179', N'016', N' กบินทร์บุรี   ', N' Kabin Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0180', N'016', N' นาดี   ', N' Na Di', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0181', N'016', N' บ้านสร้าง   ', N' Ban Sang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0182', N'016', N' ประจันตคาม   ', N' Prachantakham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0183', N'016', N' ศรีมหาโพธิ   ', N' Si Maha Phot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0184', N'016', N' ศรีมโหสถ   ', N' Si Mahosot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0185', N'017', N' เมืองนครนายก   ', N' Mueang Nakhon Nayok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0186', N'017', N' ปากพลี   ', N' Pak Phli', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0187', N'017', N' บ้านนา   ', N' Ban Na', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0188', N'017', N' องครักษ์   ', N' Ongkharak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0189', N'018', N' เมืองสระแก้ว   ', N' Mueang Sa Kaeo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0190', N'018', N' คลองหาด   ', N' Khlong Hat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0191', N'018', N' ตาพระยา   ', N' Ta Phraya', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0192', N'018', N' วังน้ำเย็น   ', N' Wang Nam Yen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0193', N'018', N' วัฒนานคร   ', N' Watthana Nakhon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0194', N'018', N' อรัญประเทศ   ', N' Aranyaprathet', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0195', N'018', N' เขาฉกรรจ์   ', N' Khao Chakan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0196', N'018', N' โคกสูง   ', N' Khok Sung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0197', N'018', N' วังสมบูรณ์   ', N' Wang Sombun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0198', N'019', N' เมืองนครราชสีมา   ', N' Mueang Nakhon Ratchasima', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0199', N'019', N' ครบุรี   ', N' Khon Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0200', N'019', N' เสิงสาง   ', N' Soeng Sang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0201', N'019', N' คง   ', N' Khong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0202', N'019', N' บ้านเหลื่อม   ', N' Ban Lueam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0203', N'019', N' จักราช   ', N' Chakkarat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0204', N'019', N' โชคชัย   ', N' Chok Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0205', N'019', N' ด่านขุนทด   ', N' Dan Khun Thot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0206', N'019', N' โนนไทย   ', N' Non Thai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0207', N'019', N' โนนสูง   ', N' Non Sung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0208', N'019', N' ขามสะแกแสง   ', N' Kham Sakaesaeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0209', N'019', N' บัวใหญ่   ', N' Bua Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0210', N'019', N' ประทาย   ', N' Prathai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0211', N'019', N' ปักธงชัย   ', N' Pak Thong Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0212', N'019', N' พิมาย   ', N' Phimai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0213', N'019', N' ห้วยแถลง   ', N' Huai Thalaeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0214', N'019', N' ชุมพวง   ', N' Chum Phuang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0215', N'019', N' สูงเนิน   ', N' Sung Noen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0216', N'019', N' ขามทะเลสอ   ', N' Kham Thale So', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0217', N'019', N' สีคิ้ว   ', N' Sikhio', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0218', N'019', N' ปากช่อง   ', N' Pak Chong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0219', N'019', N' หนองบุญมาก   ', N' Nong Bunnak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0220', N'019', N' แก้งสนามนาง   ', N' Kaeng Sanam Nang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0221', N'019', N' โนนแดง   ', N' Non Daeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0222', N'019', N' วังน้ำเขียว   ', N' Wang Nam Khiao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0223', N'019', N' เทพารักษ์   ', N' Thepharak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0224', N'019', N' เมืองยาง   ', N' Mueang Yang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0225', N'019', N' พระทองคำ   ', N' Phra Thong Kham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0226', N'019', N' ลำทะเมนชัย   ', N' Lam Thamenchai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0227', N'019', N' บัวลาย   ', N' Bua Lai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0228', N'019', N' สีดา   ', N' Sida', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0229', N'019', N' เฉลิมพระเกียรติ', N' Chaloem Phra Kiat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0230', N'020', N' เมืองบุรีรัมย์   ', N' Mueang Buri Ram', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0231', N'020', N' คูเมือง   ', N' Khu Mueang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0232', N'020', N' กระสัง', N' Krasang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0233', N'020', N' นางรอง   ', N' Nang Rong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0234', N'020', N' หนองกี่   ', N' Nong Ki', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0235', N'020', N' ละหานทราย   ', N' Lahan Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0236', N'020', N' ประโคนชัย   ', N' Prakhon Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0237', N'020', N' บ้านกรวด   ', N' Ban Kruat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0238', N'020', N' พุทไธสง   ', N' Phutthaisong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0239', N'020', N' ลำปลายมาศ   ', N' Lam Plai Mat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0240', N'020', N' สตึก   ', N' Satuek', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0241', N'020', N' ปะคำ   ', N' Pakham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0242', N'020', N' นาโพธิ์   ', N' Na Pho', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0243', N'020', N' หนองหงส์   ', N' Nong Hong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0244', N'020', N' พลับพลาชัย   ', N' Phlapphla Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0245', N'020', N' ห้วยราช   ', N' Huai Rat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0246', N'020', N' โนนสุวรรณ   ', N' Non Suwan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0247', N'020', N' ชำนิ   ', N' Chamni', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0248', N'020', N' บ้านใหม่ไชยพจน์   ', N' Ban Mai Chaiyaphot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0249', N'020', N' โนนดินแดง   ', N' Din Daeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0250', N'020', N' บ้านด่าน   ', N' Ban Dan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0251', N'020', N' แคนดง   ', N' Khaen Dong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0252', N'020', N' เฉลิมพระเกียรติ', N' Chaloem Phra Kiat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0253', N'021', N' เมืองสุรินทร์   ', N' Mueang Surin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0254', N'021', N' ชุมพลบุรี   ', N' Chumphon Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0255', N'021', N' ท่าตูม   ', N' Tha Tum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0256', N'021', N' จอมพระ   ', N' Chom Phra', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0257', N'021', N' ปราสาท   ', N' Prasat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0258', N'021', N' กาบเชิง   ', N' Kap Choeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0259', N'021', N' รัตนบุรี   ', N' Rattanaburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0260', N'021', N' สนม   ', N' Sanom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0261', N'021', N' ศีขรภูมิ   ', N' Sikhoraphum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0262', N'021', N' สังขะ   ', N' Sangkha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0263', N'021', N' ลำดวน   ', N' Lamduan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0264', N'021', N' สำโรงทาบ   ', N' Samrong Thap', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0265', N'021', N' บัวเชด   ', N' Buachet', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0266', N'021', N' พนมดงรัก   ', N' Phanom Dong Rak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0267', N'021', N' ศรีณรงค์   ', N' Si Narong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0268', N'021', N' เขวาสินรินทร์   ', N' Khwao Sinarin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0269', N'021', N' โนนนารายณ์   ', N' Non Narai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0270', N'022', N' เมืองศรีสะเกษ   ', N' Mueang Si Sa Ket', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0271', N'022', N' ยางชุมน้อย   ', N' Yang Chum Noi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0272', N'022', N' กันทรารมย์   ', N' Kanthararom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0273', N'022', N' กันทรลักษ์   ', N' Kantharalak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0274', N'022', N' ขุขันธ์   ', N' Khukhan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0275', N'022', N' ไพรบึง   ', N' Phrai Bueng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0276', N'022', N' ปรางค์กู่   ', N' Prang Ku', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0277', N'022', N' ขุนหาญ   ', N' Khun Han', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0278', N'022', N' ราษีไศล   ', N' Rasi Salai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0279', N'022', N' อุทุมพรพิสัย   ', N' Uthumphon Phisai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0280', N'022', N' บึงบูรพ์   ', N' Bueng Bun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0281', N'022', N' ห้วยทับทัน   ', N' Huai Thap Than', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0282', N'022', N' โนนคูณ   ', N' Non Khun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0283', N'022', N' ศรีรัตนะ   ', N' Si Rattana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0284', N'022', N' น้ำเกลี้ยง   ', N' Si Rattana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0285', N'022', N' วังหิน   ', N' Wang Hin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0286', N'022', N' ภูสิงห์   ', N' Phu Sing', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0287', N'022', N' เมืองจันทร์   ', N' Mueang Chan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0288', N'022', N' เบญจลักษ์   ', N' Benchalak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0289', N'022', N' พยุห์   ', N' Phayu', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0290', N'022', N' โพธิ์ศรีสุวรรณ   ', N' Pho Si Suwan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0291', N'022', N' ศิลาลาด   ', N' Sila Lat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0292', N'023', N' เมืองอุบลราชธานี   ', N' Mueang Ubon Ratchathani', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0293', N'023', N' ศรีเมืองใหม่   ', N' Si Mueang Mai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0294', N'023', N' โขงเจียม   ', N' Khong Chiam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0295', N'023', N' เขื่องใน   ', N' Khueang Nai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0296', N'023', N' เขมราฐ   ', N' Khemarat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0297', N'023', N' เดชอุดม   ', N' Det Udom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0298', N'023', N' นาจะหลวย   ', N' Na Chaluai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0299', N'023', N' น้ำยืน   ', N' Nam Yuen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0300', N'023', N' บุณฑริก   ', N' Buntharik', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0301', N'023', N' ตระการพืชผล   ', N' Trakan Phuet Phon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0302', N'023', N' กุดข้าวปุ้น   ', N' Kut Khaopun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0303', N'023', N' ม่วงสามสิบ   ', N' Muang Sam Sip', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0304', N'023', N' วารินชำราบ   ', N' Warin Chamrap', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0305', N'023', N' พิบูลมังสาหาร   ', N' Phibun Mangsahan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0306', N'023', N' ตาลสุม   ', N' Tan Sum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0307', N'023', N' โพธิ์ไทร   ', N' Pho Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0308', N'023', N' สำโรง   ', N' Samrong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0309', N'023', N' ดอนมดแดง   ', N' Don Mot Daeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0310', N'023', N' สิรินธร   ', N' Sirindhorn', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0311', N'023', N' ทุ่งศรีอุดม   ', N' Thung Si Udom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0312', N'023', N' นาเยีย   ', N' Na Yia', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0313', N'023', N' นาตาล   ', N' Na Tan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0314', N'023', N' เหล่าเสือโก้ก   ', N' Lao Suea Kok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0315', N'023', N' สว่างวีระวงศ์   ', N' Sawang Wirawong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0316', N'023', N' น้ำขุ่น   ', N' Nam Khun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0317', N'024', N' เมืองยโสธร   ', N' Mueang Yasothon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0318', N'024', N' ทรายมูล   ', N' Sai Mun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0319', N'024', N' กุดชุม   ', N' Kut Chum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0320', N'024', N' คำเขื่อนแก้ว   ', N' Kham Khuean Kaeo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0321', N'024', N' ป่าติ้ว   ', N' Pa Tio', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0322', N'024', N' มหาชนะชัย   ', N' Maha Chana Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0323', N'024', N' ค้อวัง   ', N' Kho Wang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0324', N'024', N' เลิงนกทา   ', N' Loeng Nok Tha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0325', N'024', N' ไทยเจริญ   ', N' Thai Charoen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0326', N'025', N' เมืองชัยภูมิ   ', N' Mueang Chaiyaphum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0327', N'025', N' บ้านเขว้า   ', N' Ban Khwao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0328', N'025', N' คอนสวรรค์   ', N' Khon Sawan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0329', N'025', N' เกษตรสมบูรณ์   ', N' Kaset Sombun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0330', N'025', N' หนองบัวแดง   ', N' Nong Bua Daeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0331', N'025', N' จัตุรัส   ', N' Chatturat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0332', N'025', N' บำเหน็จณรงค์   ', N' Bamnet Narong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0333', N'025', N' หนองบัวระเหว   ', N' Nong Bua Rawe', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0334', N'025', N' เทพสถิต   ', N' Thep Sathit', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0335', N'025', N' ภูเขียว   ', N' Phu Khiao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0336', N'025', N' บ้านแท่น   ', N' Ban Thaen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0337', N'025', N' แก้งคร้อ   ', N' Kaeng Khro', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0338', N'025', N' คอนสาร   ', N' Khon San', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0339', N'025', N' ภักดีชุมพล   ', N' Phakdi Chumphon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0340', N'025', N' เนินสง่า   ', N' Noen Sa-nga', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0341', N'025', N' ซับใหญ่   ', N' Sap Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0342', N'026', N' เมืองอำนาจเจริญ   ', N' Mueang Amnat Charoen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0343', N'026', N' ชานุมาน   ', N' Chanuman', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0344', N'026', N' ปทุมราชวงศา   ', N' Pathum Ratchawongsa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0345', N'026', N' พนา   ', N' Phana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0346', N'026', N' เสนางคนิคม   ', N' Senangkhanikhom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0347', N'026', N' หัวตะพาน   ', N' Hua Taphan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0348', N'026', N' ลืออำนาจ   ', N' Lue Amnat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0349', N'027', N' เมืองบึงกาฬ   ', N' Mueang Bueng Kan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0350', N'027', N' พรเจริญ   ', N' Phon Charoen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0351', N'027', N' โซ่พิสัย   ', N' So Phisai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0352', N'027', N' เซกา   ', N' Seka', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0353', N'027', N' ปากคาด   ', N' Pak Khat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0354', N'027', N' บึงโขงหลง   ', N' Bueng Khong Long', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0355', N'027', N' ศรีวิไล   ', N' Si Wilai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0356', N'027', N' บุ่งคล้า   ', N' Bung Khla', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0357', N'028', N' เมืองหนองบัวลำภู   ', N' Mueang Nong Bua Lam Phu', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0358', N'028', N' นากลาง   ', N' Na Klang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0359', N'028', N' โนนสัง   ', N' Non Sang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0360', N'028', N' ศรีบุญเรือง   ', N' Si Bun Rueang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0361', N'028', N' สุวรรณคูหา   ', N' Suwannakhuha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0362', N'028', N' นาวัง   ', N' Na Wang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0363', N'029', N' เมืองขอนแก่น   ', N' Mueang Khon Kaen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0364', N'029', N' บ้านฝาง   ', N' Ban Fang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0365', N'029', N' พระยืน   ', N' Phra Yuen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0366', N'029', N' หนองเรือ   ', N' Nong Ruea', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0367', N'029', N' ชุมแพ   ', N' Chum Phae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0368', N'029', N' สีชมพู   ', N' Si Chomphu', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0369', N'029', N' น้ำพอง   ', N' Nam Phong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0370', N'029', N' อุบลรัตน์   ', N' Ubolratana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0371', N'029', N' กระนวน   ', N' Kranuan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0372', N'029', N' บ้านไผ่   ', N' Ban Phai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0373', N'029', N' เปือยน้อย   ', N' Pueai Noi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0374', N'029', N' พล   ', N' Phon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0375', N'029', N' แวงใหญ่   ', N' Waeng Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0376', N'029', N' แวงน้อย   ', N' Waeng Noi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0377', N'029', N' หนองสองห้อง   ', N' Nong Song Hong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0378', N'029', N' ภูเวียง   ', N' Phu Wiang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0379', N'029', N' มัญจาคีรี   ', N' Mancha Khiri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0380', N'029', N' ชนบท   ', N' Chonnabot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0381', N'029', N' เขาสวนกวาง   ', N' Khao Suan Kwang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0382', N'029', N' ภูผาม่าน   ', N' Phu Pha Man', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0383', N'029', N' ซำสูง   ', N' Sam Sung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0384', N'029', N' โคกโพธิ์ไชย   ', N' Khok Pho Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0385', N'029', N' หนองนาคำ   ', N' Nong Na Kham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0386', N'029', N' บ้านแฮด   ', N' Ban Haet', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0387', N'029', N' โนนศิลา   ', N' Non Sila', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0388', N'029', N' เวียงเก่า   ', N' Wiang Kao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0389', N'030', N' เมืองอุดรธานี   ', N' Mueang Udon Thani', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0390', N'030', N' กุดจับ   ', N' Kut Chap', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0391', N'030', N' หนองวัวซอ   ', N' Nong Wua So', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0392', N'030', N' กุมภวาปี   ', N' Kumphawapi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0393', N'030', N' โนนสะอาด   ', N' Non Sa-at', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0394', N'030', N' หนองหาน   ', N' Nong Han', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0395', N'030', N' ทุ่งฝน   ', N' Thung Fon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0396', N'030', N' ไชยวาน   ', N' Chai Wan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0397', N'030', N' ศรีธาตุ   ', N' Si That', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0398', N'030', N' วังสามหมอ   ', N' Wang Sam Mo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0399', N'030', N' บ้านดุง   ', N' Ban Dung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0400', N'030', N' บ้านผือ   ', N' Ban Phue', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0401', N'030', N' น้ำโสม   ', N' Nam Som', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0402', N'030', N' เพ็ญ   ', N' Phen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0403', N'030', N' สร้างคอม   ', N' Sang Khom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0404', N'030', N' หนองแสง   ', N' Nong Saeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0405', N'030', N' นายูง   ', N' Na Yung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0406', N'030', N' พิบูลย์รักษ์   ', N' Phibun Rak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0407', N'030', N' กู่แก้ว   ', N' Ku Kaeo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0408', N'030', N' ประจักษ์ศิลปาคม   ', N' Prachak-sinlapakhom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0409', N'031', N' เมืองเลย   ', N' Mueang Loei', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0410', N'031', N' นาด้วง   ', N' Na Duang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0411', N'031', N' เชียงคาน   ', N' Chiang Khan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0412', N'031', N' ปากชม   ', N' Pak Chom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0413', N'031', N' ด่านซ้าย   ', N' Dan Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0414', N'031', N' นาแห้ว   ', N' Na Haeo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0415', N'031', N' ภูเรือ   ', N' Phu Ruea', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0416', N'031', N' ท่าลี่   ', N' Tha Li', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0417', N'031', N' วังสะพุง   ', N' Wang Saphung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0418', N'031', N' ภูกระดึง   ', N' Phu Kradueng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0419', N'031', N' ภูหลวง   ', N' Phu Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0420', N'031', N' ผาขาว   ', N' Pha Khao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0421', N'031', N' เอราวัณ   ', N' Erawan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0422', N'031', N' หนองหิน   ', N' Nong Hin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0423', N'032', N' เมืองหนองคาย   ', N' Mueang Nong Khai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0424', N'032', N' ท่าบ่อ   ', N' Tha Bo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0425', N'032', N' โพนพิสัย   ', N' Phon Phisai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0426', N'032', N' ศรีเชียงใหม่   ', N' Si Chiang Mai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0427', N'032', N' สังคม   ', N' Sangkhom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0428', N'032', N' สระใคร   ', N' Sakhrai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0429', N'032', N' เฝ้าไร่   ', N' Fao Rai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0430', N'032', N' รัตนวาปี   ', N' Rattanawapi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0431', N'032', N' โพธิ์ตาก   ', N' Pho Tak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0432', N'033', N' เมืองมหาสารคาม   ', N' Mueang Maha Sarakham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0433', N'033', N' แกดำ   ', N' Kae Dam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0434', N'033', N' โกสุมพิสัย   ', N' Kosum Phisai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0435', N'033', N' กันทรวิชัย   ', N' Kantharawichai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0436', N'033', N' เชียงยืน   ', N' Kantharawichai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0437', N'033', N' บรบือ   ', N' Borabue', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0438', N'033', N' นาเชือก   ', N' Na Chueak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0439', N'033', N' พยัคฆภูมิพิสัย   ', N' Phayakkhaphum Phisai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0440', N'033', N' วาปีปทุม   ', N' Wapi Pathum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0441', N'033', N' นาดูน   ', N' Na Dun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0442', N'033', N' ยางสีสุราช   ', N' Yang Sisurat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0443', N'033', N' กุดรัง   ', N' Kut Rang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0444', N'033', N' ชื่นชม   ', N' Chuen Chom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0445', N'034', N' เมืองร้อยเอ็ด   ', N' Mueang Roi Et', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0446', N'034', N' เกษตรวิสัย   ', N' Kaset Wisai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0447', N'034', N' ปทุมรัตต์   ', N' Pathum Rat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0448', N'034', N' จตุรพักตรพิมาน   ', N' Chaturaphak Phiman', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0449', N'034', N' ธวัชบุรี   ', N' Thawat Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0450', N'034', N' พนมไพร   ', N' Phanom Phrai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0451', N'034', N' โพนทอง   ', N' Phon Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0452', N'034', N' โพธิ์ชัย   ', N' Pho Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0453', N'034', N' หนองพอก   ', N' Nong Phok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0454', N'034', N' เสลภูมิ   ', N' Selaphum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0455', N'034', N' สุวรรณภูมิ   ', N' Suwannaphum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0456', N'034', N' เมืองสรวง   ', N' Mueang Suang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0457', N'034', N' โพนทราย   ', N' Phon Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0458', N'034', N' อาจสามารถ   ', N' At Samat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0459', N'034', N' เมยวดี   ', N' Moei Wadi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0460', N'034', N' ศรีสมเด็จ   ', N' Si Somdet', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0461', N'034', N' จังหาร   ', N' Changhan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0462', N'034', N' เชียงขวัญ   ', N' Chiang Khwan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0463', N'034', N' หนองฮี   ', N' Nong Hi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0464', N'034', N' ทุ่งเขาหลวง   ', N' Thung Khao Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0465', N'035', N' เมืองกาฬสินธุ์   ', N' Mueang Kalasin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0466', N'035', N' นามน   ', N' Na Mon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0467', N'035', N' กมลาไสย   ', N' Kamalasai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0468', N'035', N' ร่องคำ   ', N' Rong Kham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0469', N'035', N' กุฉินารายณ์   ', N' Kuchinarai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0470', N'035', N' เขาวง   ', N' Khao Wong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0471', N'035', N' ยางตลาด   ', N' Yang Talat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0472', N'035', N' ห้วยเม็ก   ', N' Huai Mek', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0473', N'035', N' สหัสขันธ์   ', N' Sahatsakhan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0474', N'035', N' คำม่วง   ', N' Kham Muang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0475', N'035', N' ท่าคันโท   ', N' Tha Khantho', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0476', N'035', N' หนองกุงศรี   ', N' Nong Kung Si', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0477', N'035', N' สมเด็จ   ', N' Somdet', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0478', N'035', N' ห้วยผึ้ง   ', N' Huai Phueng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0479', N'035', N' สามชัย   ', N' Sam Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0480', N'035', N' นาคู   ', N' Na Khu', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0481', N'035', N' ดอนจาน   ', N' Don Chan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0482', N'035', N' ฆ้องชัย   ', N' Khong Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0483', N'036', N' เมืองสกลนคร   ', N' Mueang Sakon Nakhon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0484', N'036', N' กุสุมาลย์   ', N' Kusuman', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0485', N'036', N' กุดบาก   ', N' Kut Bak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0486', N'036', N' พรรณานิคม   ', N' Phanna Nikhom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0487', N'036', N' พังโคน   ', N' Phang Khon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0488', N'036', N' วาริชภูมิ   ', N' Waritchaphum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0489', N'036', N' นิคมน้ำอูน   ', N' Nikhom Nam Un', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0490', N'036', N' วานรนิวาส   ', N' Wanon Niwat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0491', N'036', N' คำตากล้า   ', N' Kham Ta Kla', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0492', N'036', N' บ้านม่วง   ', N' Ban Muang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0493', N'036', N' อากาศอำนวย   ', N' Akat Amnuai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0494', N'036', N' สว่างแดนดิน   ', N' Sawang Daen Din', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0495', N'036', N' ส่องดาว   ', N' Song Dao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0496', N'036', N' เต่างอย   ', N' Tao Ngoi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0497', N'036', N' โคกศรีสุพรรณ   ', N' Khok Si Suphan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0498', N'036', N' เจริญศิลป์   ', N' Charoen Sin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0499', N'036', N' โพนนาแก้ว   ', N' Phon Na Kaeo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0500', N'036', N' ภูพาน   ', N' Phu Phan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0501', N'037', N' เมืองนครพนม   ', N' Mueang Nakhon Phanom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0502', N'037', N' ปลาปาก   ', N' Pla Pak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0503', N'037', N' ท่าอุเทน   ', N' Tha Uthen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0504', N'037', N' บ้านแพง   ', N' Ban Phaeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0505', N'037', N' ธาตุพนม   ', N' That Phanom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0506', N'037', N' เรณูนคร   ', N' Renu Nakhon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0507', N'037', N' นาแก   ', N' Na Kae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0508', N'037', N' ศรีสงคราม   ', N' Si Songkhram', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0509', N'037', N' นาหว้า   ', N' Na Wa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0510', N'037', N' โพนสวรรค์   ', N' Phon Sawan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0511', N'037', N' นาทม   ', N' Na Thom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0512', N'037', N' วังยาง   ', N' Wang Yang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0513', N'038', N' เมืองมุกดาหาร   ', N' Mueang Mukdahan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0514', N'038', N' นิคมคำสร้อย   ', N' Nikhom Kham Soi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0515', N'038', N' ดอนตาล   ', N' Don Tan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0516', N'038', N' ดงหลวง   ', N' Dong Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0517', N'038', N' คำชะอี   ', N' Khamcha-i', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0518', N'038', N' หว้านใหญ่   ', N' Wan Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0519', N'038', N' หนองสูง   ', N' Nong Sung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0520', N'039', N' เมืองเชียงใหม่   ', N' Mueang Chiang Mai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0521', N'039', N' จอมทอง   ', N' Chom Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0522', N'039', N' แม่แจ่ม   ', N' Mae Chaem', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0523', N'039', N' เชียงดาว   ', N' Chiang Dao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0524', N'039', N' ดอยสะเก็ด   ', N' Doi Saket', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0525', N'039', N' แม่แตง   ', N' Mae Taeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0526', N'039', N' แม่ริม   ', N' Mae Rim', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0527', N'039', N' สะเมิง   ', N' Samoeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0528', N'039', N' ฝาง   ', N' Fang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0529', N'039', N' แม่อาย   ', N' Mae Ai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0530', N'039', N' พร้าว   ', N' Phrao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0531', N'039', N' สันป่าตอง   ', N' San Pa Tong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0532', N'039', N' สันกำแพง   ', N' San Kamphaeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0533', N'039', N' สันทราย   ', N' San Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0534', N'039', N' หางดง   ', N' Hang Dong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0535', N'039', N' ฮอด   ', N' Hot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0536', N'039', N' ดอยเต่า   ', N' Doi Tao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0537', N'039', N' อมก๋อย   ', N' Omkoi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0538', N'039', N' สารภี   ', N' Saraphi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0539', N'039', N' เวียงแหง   ', N' Wiang Haeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0540', N'039', N' ไชยปราการ   ', N' Chai Prakan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0541', N'039', N' แม่วาง   ', N' Mae Wang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0542', N'039', N' แม่ออน   ', N' Mae On', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0543', N'039', N' ดอยหล่อ   ', N' Doi Lo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0544', N'039', N' กัลยาณิวัฒนา', N' Kalayani Vadhana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0545', N'040', N' เมืองลำพูน   ', N' Mueang Lamphun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0546', N'040', N' แม่ทา   ', N' Mae Tha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0547', N'040', N' บ้านโฮ่ง   ', N' Ban Hong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0548', N'040', N' ลี้   ', N' Li', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0549', N'040', N' ทุ่งหัวช้าง   ', N' Thung Hua Chang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0550', N'040', N' ป่าซาง   ', N' Pa Sang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0551', N'040', N' บ้านธิ   ', N' Ban Thi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0552', N'040', N' เวียงหนองล่อง   ', N' Wiang Nong Long', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0553', N'041', N' เมืองลำปาง   ', N' Mueang Lampang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0554', N'041', N' แม่เมาะ   ', N' Mae Mo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0555', N'041', N' เกาะคา   ', N' Ko Kha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0556', N'041', N' เสริมงาม   ', N' Soem Ngam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0557', N'041', N' งาว   ', N' Ngao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0558', N'041', N' แจ้ห่ม   ', N' Chae Hom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0559', N'041', N' วังเหนือ   ', N' Wang Nuea', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0560', N'041', N' เถิน   ', N' Thoen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0561', N'041', N' แม่พริก   ', N' Mae Phrik', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0562', N'041', N' แม่ทะ   ', N' Mae Tha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0563', N'041', N' สบปราบ   ', N' Sop Prap', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0564', N'041', N' ห้างฉัตร   ', N' Hang Chat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0565', N'041', N' เมืองปาน   ', N' Mueang Pan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0566', N'042', N' เมืองอุตรดิตถ์   ', N' Mueang Uttaradit', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0567', N'042', N' ตรอน   ', N' Tron', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0568', N'042', N' ท่าปลา   ', N' Tha Pla', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0569', N'042', N' น้ำปาด   ', N' Nam Pat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0570', N'042', N' ฟากท่า   ', N' Fak Tha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0571', N'042', N' บ้านโคก   ', N' Ban Khok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0572', N'042', N' พิชัย   ', N' Phichai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0573', N'042', N' ลับแล   ', N' Laplae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0574', N'042', N' ทองแสนขัน   ', N' Thong Saen Khan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0575', N'043', N' เมืองแพร่   ', N' Mueang Phrae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0576', N'043', N' ร้องกวาง   ', N' Rong Kwang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0577', N'043', N' ลอง   ', N' Long', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0578', N'043', N' สูงเม่น   ', N' Sung Men', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0579', N'043', N' เด่นชัย   ', N' Den Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0580', N'043', N' สอง   ', N' Song', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0581', N'043', N' วังชิ้น   ', N' Wang Chin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0582', N'043', N' หนองม่วงไข่   ', N' Nong Muang Khai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0583', N'044', N' เมืองน่าน   ', N' Mueang Nan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0584', N'044', N' แม่จริม   ', N' Mae Charim', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0585', N'044', N' บ้านหลวง   ', N' Ban Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0586', N'044', N' นาน้อย   ', N' Na Noi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0587', N'044', N' ปัว   ', N' Pua', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0588', N'044', N' ท่าวังผา   ', N' Tha Wang Pha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0589', N'044', N' เวียงสา   ', N' Wiang Sa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0590', N'044', N' ทุ่งช้าง   ', N' Thung Chang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0591', N'044', N' เชียงกลาง   ', N' Chiang Klang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0592', N'044', N' นาหมื่น   ', N' Na Muen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0593', N'044', N' สันติสุข   ', N' Santi Suk', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0594', N'044', N' บ่อเกลือ   ', N' Bo Kluea', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0595', N'044', N' สองแคว   ', N' Song Khwae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0596', N'044', N' ภูเพียง   ', N' Phu Phiang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0597', N'044', N' เฉลิมพระเกียรติ', N' Chaloem Phra Kiat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0598', N'045', N' เมืองพะเยา   ', N' Mueang Phayao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0599', N'045', N' จุน   ', N' Chun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0600', N'045', N' เชียงคำ   ', N' Chiang Kham', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0601', N'045', N' เชียงม่วน   ', N' Chiang Muan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0602', N'045', N' ดอกคำใต้   ', N' Dok Khamtai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0603', N'045', N' ปง   ', N' Pong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0604', N'045', N' แม่ใจ   ', N' Mae Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0605', N'045', N' ภูซาง   ', N' Phu Sang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0606', N'045', N' ภูกามยาว   ', N' Phu Kamyao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0607', N'046', N' เมืองเชียงราย   ', N' Mueang Chiang Rai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0608', N'046', N' เวียงชัย   ', N' Wiang Chai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0609', N'046', N' เชียงของ   ', N' Chiang Khong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0610', N'046', N' เทิง   ', N' Thoeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0611', N'046', N' พาน   ', N' Phan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0612', N'046', N' ป่าแดด   ', N' Pa Daet', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0613', N'046', N' แม่จัน   ', N' Mae Chan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0614', N'046', N' เชียงแสน   ', N' Chiang Saen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0615', N'046', N' แม่สาย   ', N' Mae Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0616', N'046', N' แม่สรวย   ', N' Mae Suai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0617', N'046', N' เวียงป่าเป้า   ', N' Wiang Pa Pao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0618', N'046', N' พญาเม็งราย   ', N' Phaya Mengrai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0619', N'046', N' เวียงแก่น   ', N' Wiang Kaen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0620', N'046', N' ขุนตาล   ', N' Khun Tan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0621', N'046', N' แม่ฟ้าหลวง   ', N' Mae Fa Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0622', N'046', N' แม่ลาว   ', N' Mae Lao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0623', N'046', N' เวียงเชียงรุ้ง   ', N' Wiang Chiang Rung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0624', N'046', N' ดอยหลวง   ', N' Doi Luang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0625', N'047', N' เมืองแม่ฮ่องสอน   ', N' Mueang Mae Hong Son', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0626', N'047', N' ขุนยวม   ', N' Khun Yuam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0627', N'047', N' ปาย   ', N' Pai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0628', N'047', N' แม่สะเรียง   ', N' Mae Sariang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0629', N'047', N' แม่ลาน้อย   ', N' Mae La Noi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0630', N'047', N' สบเมย   ', N' Sop Moei', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0631', N'047', N' ปางมะผ้า   ', N' Pang Mapha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0632', N'048', N' เมืองนครสวรรค์   ', N' Mueang Nakhon Sawan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0633', N'048', N' โกรกพระ   ', N' Krok Phra', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0634', N'048', N' ชุมแสง   ', N' Chum Saeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0635', N'048', N' หนองบัว   ', N' Nong Bua', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0636', N'048', N' บรรพตพิสัย   ', N' Banphot Phisai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0637', N'048', N' เก้าเลี้ยว   ', N' Kao Liao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0638', N'048', N' ตาคลี   ', N' Takhli', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0639', N'048', N' ท่าตะโก   ', N' Tatako', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0640', N'048', N' ไพศาลี   ', N' Phaisali', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0641', N'048', N' พยุหะคีรี   ', N' Phayuha Khiri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0642', N'048', N' ลาดยาว   ', N' Phayuha Khiri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0643', N'048', N' ตากฟ้า   ', N' Tak Fa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0644', N'048', N' แม่วงก์   ', N' Mae Wong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0645', N'048', N' แม่เปิน   ', N' Mae Poen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0646', N'048', N' ชุมตาบง   ', N' Chum Ta Bong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0647', N'049', N' เมืองอุทัยธานี   ', N' Mueang Uthai Thani', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0648', N'049', N' ทัพทัน   ', N' Thap Than', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0649', N'049', N' สว่างอารมณ์   ', N' Sawang Arom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0650', N'049', N' หนองฉาง   ', N' Nong Chang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0651', N'049', N' หนองขาหย่าง   ', N' Nong Khayang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0652', N'049', N' บ้านไร่   ', N' Ban Rai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0653', N'049', N' ลานสัก   ', N' Lan Sak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0654', N'049', N' ห้วยคต   ', N' Huai Khot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0655', N'050', N' เมืองกำแพงเพชร   ', N' Mueang Kamphaeng Phet', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0656', N'050', N' ไทรงาม   ', N' Sai Ngam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0657', N'050', N' คลองลาน   ', N' Khlong Lan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0658', N'050', N' ขาณุวรลักษบุรี   ', N' Khanu Woralaksaburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0659', N'050', N' คลองขลุง   ', N' Khlong Khlung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0660', N'050', N' พรานกระต่าย   ', N' Phran Kratai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0661', N'050', N' ลานกระบือ   ', N' Lan Krabue', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0662', N'050', N' ทรายทองวัฒนา   ', N' Sai Thong Watthana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0663', N'050', N' ปางศิลาทอง   ', N' Pang Sila Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0664', N'050', N' บึงสามัคคี   ', N' Bueng Samakkhi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0665', N'050', N' โกสัมพีนคร   ', N' Kosamphi Nakhon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0666', N'051', N' เมืองตาก   ', N' Mueang Tak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0667', N'051', N' บ้านตาก   ', N' Ban Tak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0668', N'051', N' สามเงา   ', N' Sam Ngao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0669', N'051', N' แม่ระมาด   ', N' Mae Ramat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0670', N'051', N' ท่าสองยาง   ', N' Tha Song Yang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0671', N'051', N' แม่สอด   ', N' Mae Sot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0672', N'051', N' พบพระ   ', N' Phop Phra', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0673', N'051', N' อุ้มผาง   ', N' Umphang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0674', N'051', N' วังเจ้า   ', N' Wang Chao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0675', N'052', N' เมืองสุโขทัย   ', N' Mueang Sukhothai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0676', N'052', N' บ้านด่านลานหอย   ', N' Ban Dan Lan Hoi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0677', N'052', N' คีรีมาศ   ', N' Khiri Mat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0678', N'052', N' กงไกรลาศ   ', N' Kong Krailat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0679', N'052', N' ศรีสัชนาลัย   ', N' Si Satchanalai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0680', N'052', N' ศรีสำโรง   ', N' Si Samrong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0681', N'052', N' สวรรคโลก   ', N' Sawankhalok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0682', N'052', N' ศรีนคร   ', N' Si Nakhon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0683', N'052', N' ทุ่งเสลี่ยม   ', N' Thung Saliam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0684', N'053', N' เมืองพิษณุโลก   ', N' Mueang Phitsanulok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0685', N'053', N' นครไทย   ', N' Nakhon Thai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0686', N'053', N' ชาติตระการ   ', N' Chat Trakan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0687', N'053', N' บางระกำ   ', N' Bang Rakam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0688', N'053', N' บางกระทุ่ม   ', N' Bang Krathum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0689', N'053', N' พรหมพิราม   ', N' Phrom Phiram', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0690', N'053', N' วัดโบสถ์   ', N' Wat Bot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0691', N'053', N' วังทอง   ', N' Wang Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0692', N'053', N' เนินมะปราง   ', N' Noen Maprang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0693', N'054', N' เมืองพิจิตร   ', N' Mueang Phichit', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0694', N'054', N' วังทรายพูน   ', N' Wang Sai Phun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0695', N'054', N' โพธิ์ประทับช้าง   ', N' Pho Prathap Chang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0696', N'054', N' ตะพานหิน   ', N' Taphan Hin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0697', N'054', N' บางมูลนาก   ', N' Bang Mun Nak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0698', N'054', N' โพทะเล   ', N' Pho Thale', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0699', N'054', N' สามง่าม   ', N' Sam Ngam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0700', N'054', N' ทับคล้อ   ', N' Tap Khlo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0701', N'054', N' สากเหล็ก   ', N' Sak Lek', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0702', N'054', N' บึงนาราง   ', N' Bueng Na Rang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0703', N'054', N' ดงเจริญ   ', N' Dong Charoen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0704', N'054', N' วชิรบารมี   ', N' Wachirabarami', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0705', N'055', N' เมืองเพชรบูรณ์   ', N' Mueang Phetchabun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0706', N'055', N' ชนแดน   ', N' Chon Daen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0707', N'055', N' หล่มสัก   ', N' Lom Sak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0708', N'055', N' หล่มเก่า   ', N' Lom Kao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0709', N'055', N' วิเชียรบุรี   ', N' Wichian Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0710', N'055', N' ศรีเทพ   ', N' Si Thep', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0711', N'055', N' หนองไผ่   ', N' Nong Phai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0712', N'055', N' บึงสามพัน   ', N' Bueng Sam Phan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0713', N'055', N' น้ำหนาว   ', N' Nam Nao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0714', N'055', N' วังโป่ง   ', N' Wang Pong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0715', N'055', N' เขาค้อ   ', N' Khao Kho', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0716', N'056', N' เมืองราชบุรี   ', N' Mueang Ratchaburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0717', N'056', N' จอมบึง   ', N' Chom Bueng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0718', N'056', N' สวนผึ้ง   ', N' Suan Phueng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0719', N'056', N' ดำเนินสะดวก   ', N' Damnoen Saduak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0720', N'056', N' บ้านโป่ง   ', N' Ban Pong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0721', N'056', N' บางแพ   ', N' Bang Phae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0722', N'056', N' โพธาราม   ', N' Photharam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0723', N'056', N' ปากท่อ   ', N' Pak Tho', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0724', N'056', N' วัดเพลง   ', N' Wat Phleng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0725', N'056', N' บ้านคา   ', N' Ban Kha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0726', N'057', N' เมืองกาญจนบุรี   ', N' Mueang Kanchanaburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0727', N'057', N' ไทรโยค   ', N' Sai Yok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0728', N'057', N' บ่อพลอย   ', N' Bo Phloi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0729', N'057', N' ศรีสวัสดิ์   ', N' Si Sawat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0730', N'057', N' ท่ามะกา   ', N' Tha Maka', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0731', N'057', N' ท่าม่วง   ', N' Tha Muang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0732', N'057', N' ทองผาภูมิ   ', N' Pha Phum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0733', N'057', N' สังขละบุรี   ', N' Sangkhla Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0734', N'057', N' พนมทวน   ', N' Phanom Thuan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0735', N'057', N' เลาขวัญ   ', N' Lao Khwan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0736', N'057', N' ด่านมะขามเตี้ย   ', N' Dan Makham Tia', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0737', N'057', N' หนองปรือ   ', N' Nong Prue', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0738', N'057', N' ห้วยกระเจา   ', N' Huai Krachao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0739', N'058', N' เมืองสุพรรณบุรี   ', N' Mueang Suphan Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0740', N'058', N' เดิมบางนางบวช   ', N' Doem Bang Nang Buat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0741', N'058', N' ด่านช้าง   ', N' Dan Chang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0742', N'058', N' บางปลาม้า   ', N' Bang Pla Ma', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0743', N'058', N' ศรีประจันต์   ', N' Si Prachan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0744', N'058', N' ดอนเจดีย์   ', N' Don Chedi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0745', N'058', N' สองพี่น้อง   ', N' Song Phi Nong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0746', N'058', N' สามชุก   ', N' Sam Chuk', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0747', N'058', N' อู่ทอง   ', N' U Thong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0748', N'058', N' หนองหญ้าไซ   ', N' Nong Ya Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0749', N'059', N' เมืองนครปฐม   ', N' Mueang Nakhon Pathom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0750', N'059', N' กำแพงแสน   ', N' Kamphaeng Saen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0751', N'059', N' นครชัยศรี   ', N' Nakhon Chai Si', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0752', N'059', N' ดอนตูม   ', N' Don Tum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0753', N'059', N' บางเลน   ', N' Bang Len', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0754', N'059', N' สามพราน   ', N' Sam Phran', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0755', N'059', N' พุทธมณฑล   ', N' Phutthamonthon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0756', N'060', N' เมืองสมุทรสาคร   ', N' Mueang Samut Sakhon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0757', N'060', N' กระทุ่มแบน   ', N' Krathum Baen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0758', N'060', N' บ้านแพ้ว   ', N' Ban Phaeo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0759', N'061', N' เมืองสมุทรสงคราม   ', N' Mueang Samut Songkhram', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0760', N'061', N' บางคนที   ', N' Bang Khonthi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0761', N'061', N' อัมพวา   ', N' Amphawa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0762', N'062', N' เมืองเพชรบุรี   ', N' Mueang Phetchaburi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0763', N'062', N' เขาย้อย   ', N' Khao Yoi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0764', N'062', N' หนองหญ้าปล้อง   ', N' Nong Ya Plong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0765', N'062', N' ชะอำ   ', N' Cha-am', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0766', N'062', N' ท่ายาง   ', N' Tha Yang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0767', N'062', N' บ้านลาด   ', N' Ban Lat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0768', N'062', N' บ้านแหลม   ', N' Ban Laem', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0769', N'062', N' แก่งกระจาน   ', N' Kaeng Krachan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0770', N'063', N' เมืองประจวบคีรีขันธ์   ', N' Mueang Prachuap Khiri Khan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0771', N'063', N' กุยบุรี   ', N' Kui Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0772', N'063', N' ทับสะแก   ', N' Thap Sakae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0773', N'063', N' บางสะพาน   ', N' Bang Saphan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0774', N'063', N' บางสะพานน้อย   ', N' Bang Saphan Noi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0775', N'063', N' ปราณบุรี   ', N' Pran Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0776', N'063', N' หัวหิน   ', N' Hua Hin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0777', N'063', N' สามร้อยยอด   ', N' Sam Roi Yot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0778', N'064', N' เมืองนครศรีธรรมราช   ', N' Mueang Nakhon Si Thammarat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0779', N'064', N' พรหมคีรี   ', N' Phrom Khiri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0780', N'064', N' ลานสกา   ', N' Lan Saka', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0781', N'064', N' ฉวาง   ', N' Chawang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0782', N'064', N' พิปูน   ', N' Phipun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0783', N'064', N' เชียรใหญ่   ', N' Chian Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0784', N'064', N' ชะอวด   ', N' Cha-uat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0785', N'064', N' ท่าศาลา   ', N' Tha Sala', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0786', N'064', N' ทุ่งสง   ', N' Thung Song', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0787', N'064', N' นาบอน   ', N' Na Bon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0788', N'064', N' ทุ่งใหญ่   ', N' Thung Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0789', N'064', N' ปากพนัง   ', N' Pak Phanang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0790', N'064', N' ร่อนพิบูลย์   ', N' Ron Phibun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0791', N'064', N' สิชล   ', N' Sichon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0792', N'064', N' ขนอม   ', N' Khanom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0793', N'064', N' หัวไทร   ', N' Hua Sai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0794', N'064', N' บางขัน   ', N' Bang Khan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0795', N'064', N' ถ้ำพรรณรา   ', N' Tham Phannara', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0796', N'064', N' จุฬาภรณ์   ', N' Chulabhorn', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0797', N'064', N' พระพรหม   ', N' Phra Phrom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0798', N'064', N' นบพิตำ   ', N' Nopphitam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0799', N'064', N' ช้างกลาง   ', N' Chang Klang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0800', N'064', N' เฉลิมพระเกียรติ', N' Chaloem Phra Kiat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0801', N'065', N' เมืองกระบี่   ', N' Mueang Krabi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0802', N'065', N' เขาพนม   ', N' Khao Phanom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0803', N'065', N' เกาะลันตา   ', N' Ko Lanta', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0804', N'065', N' คลองท่อม   ', N' Khlong Thom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0805', N'065', N' อ่าวลึก   ', N' Ao Luek', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0806', N'065', N' ปลายพระยา   ', N' Plai Phraya', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0807', N'065', N' ลำทับ   ', N' Lam Thap', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0808', N'065', N' เหนือคลอง   ', N' Nuea Khlong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0809', N'066', N' เมืองพังงา   ', N' Mueang Phang-nga', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0810', N'066', N' เกาะยาว   ', N' Ko Yao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0811', N'066', N' กะปง   ', N' Kapong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0812', N'066', N' ตะกั่วทุ่ง   ', N' Takua Thung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0813', N'066', N' ตะกั่วป่า   ', N' Takua Pa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0814', N'066', N' คุระบุรี   ', N' Khura Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0815', N'066', N' ทับปุด   ', N' Thap Put', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0816', N'066', N' ท้ายเหมือง   ', N' Thai Mueang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0817', N'067', N' เมืองภูเก็ต   ', N' Mueang Phuket', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0818', N'067', N' กะทู้   ', N' Kathu', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0819', N'067', N' ถลาง   ', N' Thalang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0820', N'068', N' เมืองสุราษฎร์ธานี   ', N' Mueang Surat Thani', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0821', N'068', N' กาญจนดิษฐ์   ', N' Kanchanadit', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0822', N'068', N' ดอนสัก   ', N' Don Sak', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0823', N'068', N' เกาะสมุย   ', N' Ko Samui', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0824', N'068', N' เกาะพะงัน   ', N' Ko Pha-ngan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0825', N'068', N' ไชยา   ', N' Chaiya', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0826', N'068', N' ท่าชนะ   ', N' Tha Chana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0827', N'068', N' คีรีรัฐนิคม   ', N' Khiri Rat Nikhom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0828', N'068', N' บ้านตาขุน   ', N' Ban Ta Khun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0829', N'068', N' พนม   ', N' Phanom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0830', N'068', N' ท่าฉาง   ', N' Tha Chang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0831', N'068', N' บ้านนาสาร   ', N' Ban Na San', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0832', N'068', N' บ้านนาเดิม   ', N' Ban Na Doem', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0833', N'068', N' เคียนซา   ', N' Khian Sa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0834', N'068', N' เวียงสระ   ', N' Wiang Sa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0835', N'068', N' พระแสง   ', N' Phrasaeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0836', N'068', N' พุนพิน   ', N' Phunphin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0837', N'068', N' ชัยบุรี   ', N' Chai Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0838', N'068', N' วิภาวดี   ', N' Vibhavadi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0839', N'069', N' เมืองระนอง   ', N' Mueang Ranong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0840', N'069', N' ละอุ่น   ', N' La-un', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0841', N'069', N' กะเปอร์   ', N' Kapoe', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0842', N'069', N' กระบุรี   ', N' Kra Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0843', N'069', N' สุขสำราญ   ', N' Suk Samran', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0844', N'070', N' เมืองชุมพร   ', N' Mueang Chumphon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0845', N'070', N' ท่าแซะ   ', N' Tha Sae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0846', N'070', N' ปะทิว   ', N' Pathio', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0847', N'070', N' หลังสวน   ', N' Lang Suan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0848', N'070', N' ละแม   ', N' Lamae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0849', N'070', N' พะโต๊ะ   ', N' Phato', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0850', N'070', N' สวี   ', N' Sawi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0851', N'070', N' ทุ่งตะโก   ', N' Thung Tako', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0852', N'071', N' เมืองสงขลา   ', N' Mueang Songkhla', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0853', N'071', N' สทิงพระ   ', N' Sathing Phra', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0854', N'071', N' จะนะ   ', N' Chana', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0855', N'071', N' นาทวี   ', N' Na Thawi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0856', N'071', N' เทพา   ', N' Thepha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0857', N'071', N' สะบ้าย้อย   ', N' Saba Yoi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0858', N'071', N' ระโนด   ', N' Ranot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0859', N'071', N' กระแสสินธุ์   ', N' Krasae Sin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0860', N'071', N' รัตภูมิ   ', N' Rattaphum', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0861', N'071', N' สะเดา   ', N' Sadao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0862', N'071', N' หาดใหญ่   ', N' Hat Yai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0863', N'071', N' นาหม่อม   ', N' Na Mom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0864', N'071', N' ควนเนียง   ', N' Khuan Niang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0865', N'071', N' บางกล่ำ   ', N' Bang Klam', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0866', N'071', N' สิงหนคร   ', N' Singhanakhon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0867', N'071', N' คลองหอยโข่ง   ', N' Khlong Hoi Khong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0868', N'072', N' เมืองสตูล   ', N' Mueang Satun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0869', N'072', N' ควนโดน   ', N' Khuan Don', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0870', N'072', N' ควนกาหลง   ', N' Khuan Kalong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0871', N'072', N' ท่าแพ   ', N' Tha Phae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0872', N'072', N' ละงู   ', N' La-ngu', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0873', N'072', N' ทุ่งหว้า   ', N' Thung Wa', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0874', N'072', N' มะนัง   ', N' Manang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0875', N'073', N' เมืองตรัง   ', N' Mueang Trang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0876', N'073', N' กันตัง   ', N' Kantang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0877', N'073', N' ย่านตาขาว   ', N' Yan Ta Khao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0878', N'073', N' ปะเหลียน   ', N' Palian', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0879', N'073', N' สิเกา   ', N' Sikao', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0880', N'073', N' ห้วยยอด   ', N' Huai Yot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0881', N'073', N' วังวิเศษ   ', N' Wang Wiset', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0882', N'073', N' นาโยง   ', N' Na Yong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0883', N'073', N' รัษฎา   ', N' Ratsada', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0884', N'073', N' หาดสำราญ   ', N' Hat Samran', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0885', N'074', N' เมืองพัทลุง   ', N' Mueang Phatthalung', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0886', N'074', N' กงหรา   ', N' Kong Ra', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0887', N'074', N' เขาชัยสน   ', N' Khao Chaison', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0888', N'074', N' ตะโหมด   ', N' Tamot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0889', N'074', N' ควนขนุน   ', N' Khuan Khanun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0890', N'074', N' ปากพะยูน   ', N' Pak Phayun', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0891', N'074', N' ศรีบรรพต   ', N' Si Banphot', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0892', N'074', N' ป่าบอน   ', N' Pa Bon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0893', N'074', N' บางแก้ว   ', N' Bang Kaeo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0894', N'074', N' ป่าพะยอม   ', N' Pa Phayom', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0895', N'074', N' ศรีนครินทร์   ', N' Srinagarindra', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0896', N'075', N' เมืองปัตตานี   ', N' Mueang Pattani', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0897', N'075', N' โคกโพธิ์   ', N' Khok Pho', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0898', N'075', N' หนองจิก   ', N' Nong Chik', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0899', N'075', N' ปะนาเระ   ', N' Panare', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0900', N'075', N' มายอ   ', N' Mayo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0901', N'075', N' ทุ่งยางแดง   ', N' Thung Yang Daeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0902', N'075', N' สายบุรี   ', N' Sai Buri', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0903', N'075', N' ไม้แก่น   ', N' Mai Kaen', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0904', N'075', N' ยะหริ่ง   ', N' Yaring', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0905', N'075', N' ยะรัง   ', N' Yarang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0906', N'075', N' กะพ้อ   ', N' Kapho', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0907', N'075', N' แม่ลาน   ', N' Mae Lan', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0908', N'076', N' เมืองยะลา   ', N' Mueang Yala', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0909', N'076', N' เบตง   ', N' Betong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0910', N'076', N' บันนังสตา   ', N' Bannang Sata', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0911', N'076', N' ธารโต   ', N' Than To', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0912', N'076', N' ยะหา   ', N' Yaha', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0913', N'076', N' รามัน   ', N' Raman', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0914', N'076', N' กาบัง   ', N' Kabang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0915', N'076', N' กรงปินัง   ', N' Krong Pinang', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0916', N'077', N' เมืองนราธิวาส   ', N' Mueang Narathiwat', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0917', N'077', N' ตากใบ   ', N' Tak Bai', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0918', N'077', N' บาเจาะ   ', N' Bacho', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0919', N'077', N' ยี่งอ   ', N' Yi-ngo', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0920', N'077', N' ระแงะ   ', N' Ra-ngae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0921', N'077', N' รือเสาะ   ', N' Rueso', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0922', N'077', N' ศรีสาคร   ', N' Si Sakhon', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0923', N'077', N' แว้ง   ', N' Waeng', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0924', N'077', N' สุคิริน   ', N' Sukhirin', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0925', N'077', N' สุไหงโก-ลก   ', N' Su-ngai Kolok', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0926', N'077', N' สุไหงปาดี   ', N' Su-ngai Padi', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0927', N'077', N' จะแนะ   ', N' Chanae', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO
INSERT INTO [dbo].[TB_MST_District] ([District_Code], [Province_Code], [District_Name_TH], [District_Name_EN], [Active], [Create_Date], [Create_By]) VALUES (N'0928', N'077', N' เจาะไอร้อง   ', N' Cho-airong', N'1', N'2024-11-13 09:29:58.540', N'IT');
GO

-- ----------------------------
-- Indexes structure for table TB_MST_District
-- ----------------------------

-- ----------------------------
-- Primary Key structure for table [dbo].[TB_MST_District]
-- ----------------------------
ALTER TABLE [dbo].[TB_MST_District] ADD PRIMARY KEY ([District_Code], [Province_Code])
GO
