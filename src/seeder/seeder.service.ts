import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member, Gender, MembershipStatus, EducationLevel, WorkSector } from '../entities/member.entity';
import { Contribution, PaymentStatus, PaymentMethod, ContributionType } from '../entities/contribution.entity';
import { EmploymentInfo, EmploymentStatus, SalaryRange } from '../entities/employment-info.entity';
import { PositionHistory, PositionLevel, PositionStatus } from '../entities/position-history.entity';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Member)
    private memberRepository: Repository<Member>,
    @InjectRepository(Contribution)
    private contributionRepository: Repository<Contribution>,
    @InjectRepository(EmploymentInfo)
    private employmentRepository: Repository<EmploymentInfo>,
    @InjectRepository(PositionHistory)
    private positionRepository: Repository<PositionHistory>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async seedMembers(count: number = 50): Promise<void> {
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

      const gender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
      const dateOfBirth = this.generateRandomDate(1960, 2000);

      // Generate Ethiopian phone number
      const phoneNumber = this.generateEthiopianPhone();

      const member = new Member();
      member.partyId = i + 1;
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

      // Education and experience
      member.educationLevel = this.getRandomEducationLevel();
      member.educationFieldOfStudy = this.getRandomFieldOfStudy();
      member.languagesSpoken = languages[Math.floor(Math.random() * languages.length)];
      member.leadershipExperience = Math.floor(Math.random() * 21); // 0-20 years
      member.workExperience = Math.floor(Math.random() * 21); // 0-20 years
      member.partyResponsibility = Math.random() > 0.7 ? this.getRandomPartyResponsibility() : undefined;
      member.previouslyPoliticalPartyMember = Math.random() > 0.8;
      member.workSector = this.getRandomWorkSector();

      await this.memberRepository.save(member);

      // Create employment info for some members
      if (Math.random() > 0.3) {
        const employment = new EmploymentInfo();
        employment.employmentStatus = EmploymentStatus.EMPLOYED;
        employment.organizationName = organizations[Math.floor(Math.random() * organizations.length)];
        employment.jobTitle = jobTitles[Math.floor(Math.random() * jobTitles.length)];
        employment.workSector = member.workSector;
        employment.monthlySalary = Math.floor(Math.random() * 50000) + 5000; // 5000-55000 ETB
        employment.salaryRange = this.getSalaryRange(employment.monthlySalary);
        employment.memberId = member.id;
        employment.member = member;

        await this.employmentRepository.save(employment);
      }

      // Create position history for some members
      if (Math.random() > 0.5) {
        const position = new PositionHistory();
        position.positionTitle = this.getRandomPositionTitle();
        position.positionLevel = this.getRandomPositionLevel();
        position.startDate = this.generateRandomDate(2020, 2024);
        position.status = PositionStatus.ACTIVE;
        position.appointingAuthority = 'የፓርቲ ማእከል';
        position.responsibilities = this.getRandomResponsibilities();
        position.achievements = Math.random() > 0.7 ? this.getRandomAchievements() : undefined;

        member.positionHistory = [position];
        await this.memberRepository.save(member);
      }
    }

    console.log(`✅ Seeded ${count} members successfully`);
  }

  async seedContributions(count: number = 200): Promise<void> {
    console.log(`Seeding ${count} contributions...`);

    const members = await this.memberRepository.find({ relations: ['employmentHistory'] });
    if (members.length === 0) {
      throw new Error('No members found. Please seed members first.');
    }

    const paymentMethods: PaymentMethod[] = [PaymentMethod.CASH, PaymentMethod.BANK, PaymentMethod.MOBILE_MONEY];
    let contributionCount = 0;

    for (const member of members) {
      // Generate contributions for the last 12 months
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12);

      for (let i = 0; i < 12; i++) {
        const contributionDate = new Date(startDate);
        contributionDate.setMonth(startDate.getMonth() + i);

        // Skip if contribution already exists
        const existing = await this.contributionRepository.findOne({
          where: {
            memberId: member.id,
            paymentMonth: contributionDate.getMonth() + 1,
            paymentYear: contributionDate.getFullYear()
          }
        });

        if (existing) continue;

        const contribution = new Contribution();
        contribution.memberId = member.id;
        contribution.member = member;
        contribution.paymentMonth = contributionDate.getMonth() + 1;
        contribution.paymentYear = contributionDate.getFullYear();
        contribution.contributionType = ContributionType.FIXED_AMOUNT;
        contribution.expectedAmount = 100; // 100 ETB standard contribution

        // Random payment status with realistic distribution
        const rand = Math.random();
        if (rand < 0.75) { // 75% paid
          contribution.paymentStatus = PaymentStatus.PAID;
          contribution.paidAmount = 100;
          contribution.paymentDate = this.generateRandomDateInMonth(contributionDate);
          contribution.paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        } else if (rand < 0.85) { // 10% partially paid
          contribution.paymentStatus = PaymentStatus.PARTIALLY_PAID;
          contribution.paidAmount = Math.floor(Math.random() * 80) + 20; // 20-99 ETB
          contribution.paymentDate = this.generateRandomDateInMonth(contributionDate);
          contribution.paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        } else { // 15% unpaid
          contribution.paymentStatus = PaymentStatus.UNPAID;
          contribution.paidAmount = 0;
        }

        await this.contributionRepository.save(contribution);
        contributionCount++;

        if (contributionCount >= count) break;
      }

      if (contributionCount >= count) break;
    }

    console.log(`✅ Seeded ${contributionCount} contributions successfully`);
  }

  async clearAllData(): Promise<void> {
    console.log('Clearing all data...');

    await this.contributionRepository.clear();
    await this.positionRepository.clear();
    await this.employmentRepository.clear();
    await this.memberRepository.clear();

    console.log('✅ All data cleared successfully');
  }

  async seedUsers(): Promise<void> {
    console.log('Seeding users...');

    // Clear existing users first
    await this.userRepository.clear();
    console.log('Cleared existing users...');

    // Create a simple admin user with plain text password
    const adminUser = this.userRepository.create({
      username: 'admin',
      password: 'admin123', // Plain text
      fullName: 'System Administrator',
      role: UserRole.SYSTEM_ADMIN,
      phone: '+251911111111',
      email: 'admin@prosperityparty.et',
      isActive: true,
    });

    await this.userRepository.save(adminUser);
    console.log('✅ Admin user created:');
    console.log('   Phone: +251911111111');
    console.log('   Password: admin123');
    console.log('   Full Name: System Administrator');
    console.log('   Role: System Admin');

    console.log('✅ Users seeded successfully');
  }

  // Helper methods
  private generateEnglishName(amharicFirst: string, amharicLast: string): string {
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

    const firstEnglish = englishNames[amharicFirst as keyof typeof englishNames] || amharicFirst;
    const lastEnglish = englishNames[amharicLast as keyof typeof englishNames] || amharicLast;

    return `${firstEnglish} ${lastEnglish}`;
  }

  private generateEthiopianPhone(): string {
    const prefixes = ['911', '912', '913', '914', '915', '916', '917', '918', '919', '921', '922', '923', '924', '925'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const number = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `+251${prefix}${number}`;
  }

  private generateNationalId(): string {
    return Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');
  }

  private generateRandomDate(startYear: number, endYear: number): Date {
    const start = new Date(startYear, 0, 1);
    const end = new Date(endYear, 11, 31);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  private generateRandomDateInMonth(baseDate: Date): Date {
    const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const end = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  }

  private getRandomMembershipStatus(): MembershipStatus {
    const statuses = [MembershipStatus.SUPPORTIVE_MEMBER, MembershipStatus.SUPPORTIVE_MEMBER, MembershipStatus.SUPPORTIVE_MEMBER, MembershipStatus.SUPPORTIVE_MEMBER, MembershipStatus.SUPPORTIVE_MEMBER, MembershipStatus.CANDIDATE, MembershipStatus.MEMBER];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }

  private getRandomEducationLevel(): EducationLevel {
    const levels = [EducationLevel.SECONDARY, EducationLevel.SECONDARY, EducationLevel.DIPLOMA, EducationLevel.BACHELOR, EducationLevel.BACHELOR, EducationLevel.MASTERS, EducationLevel.NONE, EducationLevel.PRIMARY];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private getRandomFieldOfStudy(): string {
    const fields = [
      'Computer Science', 'Business Administration', 'Engineering', 'Medicine', 'Law',
      'Economics', 'Political Science', 'Education', 'Agriculture', 'Sociology',
      'Accounting', 'Marketing', 'Psychology', 'History', 'Literature'
    ];
    return fields[Math.floor(Math.random() * fields.length)];
  }

  private getRandomPartyResponsibility(): string {
    const responsibilities = [
      'ኮሚቴ አባል', 'ኮሚቴ ሊቀ መልአክ', 'ክፍለ ከተማ አስተባባሪ', 'ዞን አስተባባሪ',
      'አካባቢ አስተባባሪ', 'የፋይናንስ ሀላፊ', 'የምርት ሀላፊ', 'የትምህርት ሀላፊ'
    ];
    return responsibilities[Math.floor(Math.random() * responsibilities.length)];
  }

  private getRandomWorkSector(): WorkSector {
    const sectors = [WorkSector.GOVERNMENT, WorkSector.PRIVATE, WorkSector.PRIVATE, WorkSector.NGO, WorkSector.SELF_EMPLOYED, WorkSector.OTHER];
    return sectors[Math.floor(Math.random() * sectors.length)];
  }

  private getRandomPositionTitle(): string {
    const titles = [
      'ኮሚቴ አባል', 'ኮሚቴ ሊቀ መልአክ', 'ክፍለ ከተማ አስተባባሪ', 'ዞን አስተባባሪ',
      'አካባቢ አስተባባሪ', 'የፋይናንስ ሀላፊ', 'የምርት ሀላፊ', 'የትምህርት ሀላፊ',
      'የአስተባባር ሀላፊ', 'የማህበራዊ ጉዳዮች ሀላፊ'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }

  private getRandomPositionLevel(): PositionLevel {
    const levels = [PositionLevel.CELL, PositionLevel.WOREDA, PositionLevel.SUB_CITY, PositionLevel.CITY, PositionLevel.REGIONAL];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private getRandomResponsibilities(): string {
    const responsibilities = [
      'የፓርቲ አባላት ምዝገባ እና ማስተባበል',
      'የፓርቲ ፖሊሲ ማስተላለፍ እና ማሳወቅ',
      'የፓርቲ ፋይናንስ ማስተባበል',
      'የፓርቲ ፕሮጀክት አስፈጻሚ',
      'የፓርቲ አባላት ማሰልጠን እና ማበሳበል'
    ];
    return responsibilities[Math.floor(Math.random() * responsibilities.length)];
  }

  private getRandomAchievements(): string {
    const achievements = [
      'አብዛኞን አባላት ለፓርቲ ለማስተባበል ስኬታማ ሆነ',
      'በክፍለ ከተማ ውድድር ላይ ተሳትፎ አሳወቀ',
      'የፓርቲ ፖሊሲ በተለያዩ አካባቢዎች አስተላለፈ',
      'አብዛኞን ፓርቲ ፕሮጀክቶች ተሳካለቸው'
    ];
    return achievements[Math.floor(Math.random() * achievements.length)];
  }

  private getSalaryRange(salary: number): SalaryRange {
    if (salary <= 5000) return SalaryRange.RANGE_0_5000;
    if (salary <= 10000) return SalaryRange.RANGE_5001_10000;
    if (salary <= 20000) return SalaryRange.RANGE_10001_20000;
    if (salary <= 30000) return SalaryRange.RANGE_20001_30000;
    if (salary <= 50000) return SalaryRange.RANGE_30001_50000;
    return SalaryRange.RANGE_50001_PLUS;
  }
}
