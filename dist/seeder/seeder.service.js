"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeederService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const member_entity_1 = require("../entities/member.entity");
const contribution_entity_1 = require("../entities/contribution.entity");
const employment_info_entity_1 = require("../entities/employment-info.entity");
const position_history_entity_1 = require("../entities/position-history.entity");
let SeederService = class SeederService {
    memberRepository;
    contributionRepository;
    employmentRepository;
    positionRepository;
    constructor(memberRepository, contributionRepository, employmentRepository, positionRepository) {
        this.memberRepository = memberRepository;
        this.contributionRepository = contributionRepository;
        this.employmentRepository = employmentRepository;
        this.positionRepository = positionRepository;
    }
    async seedMembers(count = 50) {
        console.log(`Seeding ${count} members...`);
        const firstNames = [
            'አብረሃም', 'ሰላም', 'ያሬድ', 'መለስ', 'ታደሰ', 'አበበ', 'በርሃኑ', 'ታዬ', 'አለሙ', 'ወንድሙ',
            'አማኑኤል', 'ያሪድ', 'ሙሉጌታ', 'አብዲ', 'ሀሰን', 'አህመድ', 'ኢብራሂም', 'አልማዝ',
            'የማን', 'ዳንኤል', 'ገብረሊባኖስ', 'ሰለሞን', 'ያሪድ', 'ተስፋዬ', 'ማርቆስ',
            'አብዲሻክ', 'ሙሃመድ', 'አሊ', 'ኦማር', 'ያሱፍ', 'ዘኪሪያስ', 'አብዱላህ',
            'ሙሀመድ', 'አልአሚን', 'ፋቲማ', 'መሪያም', 'ሳራ', 'ሀዊ', 'አዲስ', 'ሀብታሙ'
        ];
        const lastNames = [
            'ተስፋዬ', 'አበበ', 'ታደሰ', 'መለስ', 'አብረሃም', 'ሰላም', 'ያሬድ', 'በርሃኑ',
            'አለሙ', 'ወንድሙ', 'አማኑኤል', 'ያሪድ', 'ሙሉጌታ', 'አብዲ', 'ሀሰን',
            'አህመድ', 'ኢብራሂም', 'አልማዝ', 'የማን', 'ዳንኤል', 'ገብረሊባኖስ',
            'ሰለሞን', 'ተስፋዬ', 'ማርቆስ', 'አብዲሻክ', 'ሙሃመድ', 'አሊ', 'ኦማር'
        ];
        const subCities = [
            'አዲስ አበባ', 'ቦሌ', 'ጉልላ', 'ኮልፌ ከርኒዮ', 'አቃቂ ቀለም', 'ንፋስ ስልክ',
            'የካ', 'ገርጂ', 'ዩኒቨርስቲ', 'ሜክሲኮ', 'ስፋ', 'ቄራ', 'ቦሌ ሚዳቃ', 'አዲስ አበባ ከተማ'
        ];
        const woredas = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
        const kebeles = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];
        const ethnicities = [
            'ኦሮሞ', 'አማራ', 'ትግራይ', 'ሶማሌ', 'ዓፋር', 'ሲዳማ', 'ጉራጌ', 'ሀዲያ', 'ከምባታ',
            'ዓማራ', 'ትግሬ', 'ኦሮሚያ', 'አማራ', 'ትግራይ', 'ሶማሊ'
        ];
        const languages = [
            ['Amharic', 'English'], ['Amharic', 'Oromifa'], ['Amharic', 'Tigrinya'],
            ['Amharic', 'Somali'], ['Amharic'], ['English'], ['Amharic', 'English', 'Arabic'],
            ['Amharic', 'French'], ['Amharic', 'Oromifa', 'English']
        ];
        const organizations = [
            'የኢትዮጵያ መንግሥት', 'የኢትዮጵያ ባንክ', 'የኢትዮጵያ ተማሪ ማህበር', 'የኢትዮጵያ ገበያ ባህል',
            'የኢትዮጵያ ገሃነም ተቋም', 'የኢትዮጵያ ንግድ ባህል', 'የኢትዮጵያ ገጠር ኢንዱስትሪ',
            'የኢትዮጵያ ትምህርት ተቋም', 'የኢትዮጵያ ጤና ተቋም', 'የኢትዮጵያ ማህበራዊ ሥራ ተቋም'
        ];
        const jobTitles = [
            'ምናባዊ ሥራ አስፈጻሚ', 'ፋይናንስ ኦፊሰር', 'ምምህር', 'ባህል ኦፊሰር',
            'ኢንጂነር', 'የጤና ሥራ ተግባራዊ', 'ኢንቨስትመንት ኦፊሰር', 'ማርኬቲንግ ኦፊሰር',
            'አርክት ኦፊሰር', 'የገንዘብ ኦፊሰር', 'አድሚንስትራትቭ ኦፊሰር', 'የምርት ኦፊሰር'
        ];
        for (let i = 0; i < count; i++) {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            const fullNameAmharic = `${firstName} ${lastName}`;
            const fullNameEnglish = this.generateEnglishName(firstName, lastName);
            const gender = Math.random() > 0.5 ? member_entity_1.Gender.MALE : member_entity_1.Gender.FEMALE;
            const dateOfBirth = this.generateRandomDate(1960, 2000);
            const phoneNumber = this.generateEthiopianPhone();
            const member = new member_entity_1.Member();
            member.partyId = `P${String(i + 1).padStart(4, '0')}`;
            member.nationalId = this.generateNationalId();
            member.fullNameAmharic = fullNameAmharic;
            member.fullNameEnglish = fullNameEnglish;
            member.gender = gender;
            member.dateOfBirth = dateOfBirth;
            member.ethnicOrigin = ethnicities[Math.floor(Math.random() * ethnicities.length)];
            member.birthState = subCities[Math.floor(Math.random() * subCities.length)];
            member.birthZone = ['ሞቃ ዞን', 'ሞቃ ሞቃ', 'ቀንዓት ዞን', 'ምስራቅ ዞን', 'ምዕራብ ዞን'][Math.floor(Math.random() * 5)];
            member.birthCity = subCities[Math.floor(Math.random() * subCities.length)];
            member.birthKebele = kebeles[Math.floor(Math.random() * kebeles.length)];
            member.primaryPhone = phoneNumber;
            member.secondaryPhone = Math.random() > 0.7 ? this.generateEthiopianPhone() : undefined;
            member.email = Math.random() > 0.6 ? `${fullNameEnglish.toLowerCase().replace(' ', '.')}@example.com` : undefined;
            member.subCity = subCities[Math.floor(Math.random() * subCities.length)];
            member.woreda = woredas[Math.floor(Math.random() * woredas.length)];
            member.kebele = kebeles[Math.floor(Math.random() * kebeles.length)];
            member.membershipStatus = this.getRandomMembershipStatus();
            member.registrationDate = this.generateRandomDate(2020, 2024);
            member.educationLevel = this.getRandomEducationLevel();
            member.educationFieldOfStudy = this.getRandomFieldOfStudy();
            member.languagesSpoken = languages[Math.floor(Math.random() * languages.length)];
            member.leadershipExperience = Math.floor(Math.random() * 21);
            member.workExperience = Math.floor(Math.random() * 21);
            member.partyResponsibility = Math.random() > 0.7 ? this.getRandomPartyResponsibility() : undefined;
            member.previouslyPoliticalPartyMember = Math.random() > 0.8;
            member.workSector = this.getRandomWorkSector();
            await this.memberRepository.save(member);
            if (Math.random() > 0.3) {
                const employment = new employment_info_entity_1.EmploymentInfo();
                employment.employmentStatus = employment_info_entity_1.EmploymentStatus.EMPLOYED;
                employment.organizationName = organizations[Math.floor(Math.random() * organizations.length)];
                employment.jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
                employment.workSector = member.workSector;
                employment.monthlySalary = Math.floor(Math.random() * 50000) + 5000;
                employment.salaryRange = this.getSalaryRange(employment.monthlySalary);
                employment.memberId = member.id;
                employment.member = member;
                await this.employmentRepository.save(employment);
            }
            if (Math.random() > 0.5) {
                const position = new position_history_entity_1.PositionHistory();
                position.positionTitle = this.getRandomPositionTitle();
                position.positionLevel = this.getRandomPositionLevel();
                position.startDate = this.generateRandomDate(2020, 2024);
                position.status = position_history_entity_1.PositionStatus.ACTIVE;
                position.appointingAuthority = 'የፓርቲ ማእከል';
                position.responsibilities = this.getRandomResponsibilities();
                position.achievements = Math.random() > 0.7 ? this.getRandomAchievements() : undefined;
                member.positionHistory = [position];
                await this.memberRepository.save(member);
            }
        }
        console.log(`✅ Seeded ${count} members successfully`);
    }
    async seedContributions(count = 200) {
        console.log(`Seeding ${count} contributions...`);
        const members = await this.memberRepository.find({ relations: ['employmentInfo'] });
        if (members.length === 0) {
            throw new Error('No members found. Please seed members first.');
        }
        const paymentMethods = [contribution_entity_1.PaymentMethod.CASH, contribution_entity_1.PaymentMethod.BANK, contribution_entity_1.PaymentMethod.MOBILE_MONEY];
        let contributionCount = 0;
        for (const member of members) {
            const startDate = new Date();
            startDate.setMonth(startDate.getMonth() - 12);
            for (let i = 0; i < 12; i++) {
                const contributionDate = new Date(startDate);
                contributionDate.setMonth(startDate.getMonth() + i);
                const existing = await this.contributionRepository.findOne({
                    where: {
                        memberId: member.id,
                        paymentMonth: contributionDate.getMonth() + 1,
                        paymentYear: contributionDate.getFullYear()
                    }
                });
                if (existing)
                    continue;
                const contribution = new contribution_entity_1.Contribution();
                contribution.memberId = member.id;
                contribution.member = member;
                contribution.paymentMonth = contributionDate.getMonth() + 1;
                contribution.paymentYear = contributionDate.getFullYear();
                contribution.contributionType = contribution_entity_1.ContributionType.FIXED_AMOUNT;
                contribution.expectedAmount = 100;
                const rand = Math.random();
                if (rand < 0.75) {
                    contribution.paymentStatus = contribution_entity_1.PaymentStatus.PAID;
                    contribution.paidAmount = 100;
                    contribution.paymentDate = this.generateRandomDateInMonth(contributionDate);
                    contribution.paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
                }
                else if (rand < 0.85) {
                    contribution.paymentStatus = contribution_entity_1.PaymentStatus.PARTIALLY_PAID;
                    contribution.paidAmount = Math.floor(Math.random() * 80) + 20;
                    contribution.paymentDate = this.generateRandomDateInMonth(contributionDate);
                    contribution.paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
                }
                else {
                    contribution.paymentStatus = contribution_entity_1.PaymentStatus.UNPAID;
                    contribution.paidAmount = 0;
                }
                await this.contributionRepository.save(contribution);
                contributionCount++;
                if (contributionCount >= count)
                    break;
            }
            if (contributionCount >= count)
                break;
        }
        console.log(`✅ Seeded ${contributionCount} contributions successfully`);
    }
    async clearAllData() {
        console.log('Clearing all data...');
        await this.contributionRepository.clear();
        await this.positionRepository.clear();
        await this.employmentRepository.clear();
        await this.memberRepository.clear();
        console.log('✅ All data cleared successfully');
    }
    generateEnglishName(amharicFirst, amharicLast) {
        const englishNames = {
            'አብረሃም': 'Abraham', 'ሰላም': 'Salam', 'ያሬድ': 'Yared', 'መለስ': 'Meles', 'ታደሰ': 'Tadesse',
            'አበበ': 'Abebe', 'በርሃኑ': 'Berhanu', 'ታዬ': 'Taye', 'አለሙ': 'Alamu', 'ወንድሙ': 'Wendimu',
            'አማኑኤል': 'Amanuel', 'ያሪድ': 'Yarid', 'ሙሉጌታ': 'Mulugheta', 'አብዲ': 'Abdi', 'ሀሰን': 'Hasen',
            'አህመድ': 'Ahmed', 'ኢብራሂም': 'Ibrahim', 'አልማዝ': 'Almaz', 'የማን': 'Yeman', 'ዳንኤል': 'Daniel',
            'ገብረሊባኖስ': 'GebreLibanos', 'ሰለሞን': 'Solomon', 'ተስፋዬ': 'Tesfaye', 'ማርቆስ': 'Marcos',
            'አብዲሻክ': 'Abdishak', 'ሙሃመድ': 'Muhammad', 'አሊ': 'Ali', 'ኦማር': 'Omar', 'ያሱፍ': 'Yasuf',
            'ዘኪሪያስ': 'Zekarias', 'አብዱላህ': 'Abdullah', 'ሙሀመድ': 'Muhammad', 'አልአሚን': 'Alamin',
            'ፋቲማ': 'Fatima', 'መሪያም': 'Meriam', 'ሳራ': 'Sara', 'ሀዊ': 'Hawi', 'አዲስ': 'Adis', 'ሀብታሙ': 'Habtamu'
        };
        const firstEnglish = englishNames[amharicFirst] || amharicFirst;
        const lastEnglish = englishNames[amharicLast] || amharicLast;
        return `${firstEnglish} ${lastEnglish}`;
    }
    generateEthiopianPhone() {
        const prefixes = ['911', '912', '913', '914', '915', '916', '917', '918', '919', '921', '922', '923', '924', '925'];
        const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const number = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
        return `+251${prefix}${number}`;
    }
    generateNationalId() {
        return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
    }
    generateRandomDate(startYear, endYear) {
        const start = new Date(startYear, 0, 1);
        const end = new Date(endYear, 11, 31);
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }
    generateRandomDateInMonth(baseDate) {
        const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }
    getRandomMembershipStatus() {
        const statuses = [member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER, member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER, member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER, member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER, member_entity_1.MembershipStatus.SUPPORTIVE_MEMBER, member_entity_1.MembershipStatus.CANDIDATE, member_entity_1.MembershipStatus.MEMBER];
        return statuses[Math.floor(Math.random() * statuses.length)];
    }
    getRandomEducationLevel() {
        const levels = [member_entity_1.EducationLevel.SECONDARY, member_entity_1.EducationLevel.SECONDARY, member_entity_1.EducationLevel.DIPLOMA, member_entity_1.EducationLevel.BACHELOR, member_entity_1.EducationLevel.BACHELOR, member_entity_1.EducationLevel.MASTERS, member_entity_1.EducationLevel.NONE, member_entity_1.EducationLevel.PRIMARY];
        return levels[Math.floor(Math.random() * levels.length)];
    }
    getRandomFieldOfStudy() {
        const fields = [
            'Computer Science', 'Business Administration', 'Engineering', 'Medicine', 'Law',
            'Economics', 'Political Science', 'Education', 'Agriculture', 'Sociology',
            'Accounting', 'Marketing', 'Psychology', 'History', 'Literature'
        ];
        return fields[Math.floor(Math.random() * fields.length)];
    }
    getRandomPartyResponsibility() {
        const responsibilities = [
            'ኮሚቴ አባል', 'ኮሚቴ ሊቀ መልአክ', 'ክፍለ ከተማ አስተባባሪ', 'ዞን አስተባባሪ',
            'አካባቢ አስተባባሪ', 'የፋይናንስ ሀላፊ', 'የምርት ሀላፊ', 'የትምህርት ሀላፊ'
        ];
        return responsibilities[Math.floor(Math.random() * responsibilities.length)];
    }
    getRandomWorkSector() {
        const sectors = [member_entity_1.WorkSector.GOVERNMENT, member_entity_1.WorkSector.PRIVATE, member_entity_1.WorkSector.PRIVATE, member_entity_1.WorkSector.NGO, member_entity_1.WorkSector.SELF_EMPLOYED, member_entity_1.WorkSector.OTHER];
        return sectors[Math.floor(Math.random() * sectors.length)];
    }
    getRandomPositionTitle() {
        const titles = [
            'ኮሚቴ አባል', 'ኮሚቴ ሊቀ መልአክ', 'ክፍለ ከተማ አስተባባሪ', 'ዞን አስተባባሪ',
            'አካባቢ አስተባባሪ', 'የፋይናንስ ሀላፊ', 'የምርት ሀላፊ', 'የትምህርት ሀላፊ',
            'የአስተባባር ሀላፊ', 'የማህበራዊ ጉዳዮች ሀላፊ'
        ];
        return titles[Math.floor(Math.random() * titles.length)];
    }
    getRandomPositionLevel() {
        const levels = [position_history_entity_1.PositionLevel.CELL, position_history_entity_1.PositionLevel.WOREDA, position_history_entity_1.PositionLevel.SUB_CITY, position_history_entity_1.PositionLevel.CITY, position_history_entity_1.PositionLevel.REGIONAL];
        return levels[Math.floor(Math.random() * levels.length)];
    }
    getRandomResponsibilities() {
        const responsibilities = [
            'የፓርቲ አባላት ምዝገባ እና ማስተባበል',
            'የፓርቲ ፖሊሲ ማስተላለፍ እና ማሳወቅ',
            'የፓርቲ ፋይናንስ ማስተባበል',
            'የፓርቲ ፕሮጀክት አስፈጻሚ',
            'የፓርቲ አባላት ማሰልጠን እና ማበሳበል'
        ];
        return responsibilities[Math.floor(Math.random() * responsibilities.length)];
    }
    getRandomAchievements() {
        const achievements = [
            'አብዛኞን አባላት ለፓርቲ ለማስተባበል ስኬታማ ሆነ',
            'በክፍለ ከተማ ውድድር ላይ ተሳትፎ አሳወቀ',
            'የፓርቲ ፖሊሲ በተለያዩ አካባቢዎች አስተላለፈ',
            'አብዛኞን ፓርቲ ፕሮጀክቶች ተሳካለቸው'
        ];
        return achievements[Math.floor(Math.random() * achievements.length)];
    }
    getSalaryRange(salary) {
        if (salary <= 5000)
            return employment_info_entity_1.SalaryRange.RANGE_0_5000;
        if (salary <= 10000)
            return employment_info_entity_1.SalaryRange.RANGE_5001_10000;
        if (salary <= 20000)
            return employment_info_entity_1.SalaryRange.RANGE_10001_20000;
        if (salary <= 30000)
            return employment_info_entity_1.SalaryRange.RANGE_20001_30000;
        if (salary <= 50000)
            return employment_info_entity_1.SalaryRange.RANGE_30001_50000;
        return employment_info_entity_1.SalaryRange.RANGE_50001_PLUS;
    }
};
exports.SeederService = SeederService;
exports.SeederService = SeederService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(member_entity_1.Member)),
    __param(1, (0, typeorm_1.InjectRepository)(contribution_entity_1.Contribution)),
    __param(2, (0, typeorm_1.InjectRepository)(employment_info_entity_1.EmploymentInfo)),
    __param(3, (0, typeorm_1.InjectRepository)(position_history_entity_1.PositionHistory)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], SeederService);
//# sourceMappingURL=seeder.service.js.map