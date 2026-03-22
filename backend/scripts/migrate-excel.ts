import * as xlsx from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
    const filePath = path.resolve(__dirname, '../../ระบบแจ้งซ่อม CCTV .xlsx');

    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    const workbook = xlsx.readFile(filePath);

    // Migrate Staff
    const staffSheet = workbook.Sheets['ผู้แก้ไข'];
    const staffData: any[] = xlsx.utils.sheet_to_json(staffSheet);

    for (const row of staffData) {
        const name = row['ชื่อ-สกุล ผู้แก้ไข'];
        const email = row['Email'];
        const phone = row['เบอร์โทร '];
        if (name) {
            await prisma.user.upsert({
                where: { username: name }, // using name as username for simplicity in migration
                update: {},
                create: {
                    username: name,
                    name: name,
                    email: email,
                    phone: phone?.toString(),
                    password: 'password', // Default password
                    role: 'STAFF',
                }
            });
            console.log(`Upserted staff: ${name}`);
        }
    }

    // Migrate Jobs
    const jobsSheet = workbook.Sheets['TEST ระบบแจ้งซ่อม CCTV '];
    const jobsData: any[] = xlsx.utils.sheet_to_json(jobsSheet);

    for (const row of jobsData) {
        const title = row['ข้อขัดข้อง'] || 'ไม่มีชื่อเรื่อง';
        const reporterName = row['ชื่อ-สกุล'];
        const reporterPhone = row['เบอร์โทร']?.toString();
        const location = `${row['สถานที่'] || ''} ${row['อำเภอ'] || ''} ${row['จังหวัด'] || ''}`.trim();
        const statusText = row['สถานะ'];

        let dbStatus: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' = 'PENDING';
        if (statusText === 'กำลังดำเนินการ') dbStatus = 'IN_PROGRESS';
        else if (statusText === 'เสร็จสิ้น') dbStatus = 'RESOLVED';

        const staffName = row['ผู้แก้ไข'];
        let assignedStaffId = null;
        if (staffName) {
            const staff = await prisma.user.findUnique({ where: { username: staffName } });
            if (staff) assignedStaffId = staff.id;
        }

        try {
            await prisma.job.create({
                data: {
                    title,
                    description: row['ส่วนที่ขัดข้อง'] || '',
                    reporterName,
                    reporterPhone,
                    location,
                    status: dbStatus,
                    assignedToId: assignedStaffId,
                }
            });
            console.log(`Created job: ${title}`);
        } catch (e) {
            console.error(`Failed to create job: ${title}`, e);
        }
    }

    console.log('Migration completed!');
    await prisma.$disconnect();
}

run().catch(e => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
});
