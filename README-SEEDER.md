# Database Seeder

This seeder populates the database with realistic sample data for development and testing purposes.

## Features

### Members Data
- **30 sample members** with authentic Ethiopian names
- **Complete profiles** including personal information, contact details, education, and employment
- **Realistic data distribution**:
  - Ethnic origins (Oromo, Amhara, Tigrinya, Somali, etc.)
  - Birth places (State, Zone, City, Kebele)
  - Education levels (Primary, Secondary, Diploma, Bachelor's, etc.)
  - Languages spoken (Amharic, English, Oromifa, etc.)
  - Employment status and work sectors
  - Leadership and work experience (in years)
  - Party responsibilities and political history

### Contributions Data
- **100 contribution records** across 12 months
- **Realistic payment patterns**:
  - 75% paid contributions
  - 10% partially paid
  - 15% unpaid
- **Proper date distribution** and payment methods
- **Linked to existing members** with correct party IDs

## Usage

### Development Mode (with TypeScript)
```bash
# Seed all data (default: 50 members, 200 contributions)
npm run seed:dev seed

# Seed specific amounts
npm run seed:dev seed 30 100

# Seed only members
npm run seed:dev members 25

# Seed only contributions
npm run seed:dev contributions 150

# Clear all data
npm run seed:dev clear
```

### Production Mode (compiled)
```bash
# Seed all data
npm run seed seed

# Other commands work the same way
npm run seed members 25
npm run seed contributions 150
npm run seed clear
```

## Sample Data Details

### Member Fields Populated
- **Party ID**: P0001 to P0030
- **Names**: Amharic and English versions
- **Personal Info**: Gender, birth date, ethnic origin
- **Birth Place**: State, Zone, City, Kebele
- **Contact**: Primary/secondary phones, email
- **Education**: Level and field of study
- **Languages**: Multiple language selections
- **Experience**: Leadership & work experience in years
- **Employment**: Organization, job title, salary, sector
- **Party Info**: Responsibilities, political history
- **Address**: Sub-city, Woreda, Kebele, detailed address

### Contribution Fields Populated
- **Member linkage**: Connected to seeded members
- **Monthly periods**: Last 12 months
- **Payment amounts**: 100 ETB standard contributions
- **Payment status**: Paid, Partially Paid, Unpaid
- **Payment methods**: Cash, Bank, Mobile Money
- **Realistic dates**: Proper payment dates within each month

## Data Quality

### Realistic Ethiopian Context
- **Authentic names**: Common Ethiopian first and last names
- **Geographic accuracy**: Real sub-cities, woredas, and kebeles
- **Cultural relevance**: Appropriate ethnic distributions
- **Economic realism**: Salary ranges and employment sectors

### Development-Friendly
- **Sequential IDs**: Easy to identify and reference
- **Varied data**: Different statuses and scenarios for testing
- **Complete relationships**: All foreign keys properly linked
- **No conflicts**: Safe to run multiple times (clears first)

## Safety

- **Development only**: Designed for development environments
- **Clear warnings**: Prompts before clearing data
- **Transactional**: All operations are atomic
- **Reversible**: Easy to clear and reseed

## Integration

The seeded data integrates seamlessly with:
- **Dashboard statistics** (shows real member/contribution counts)
- **Reports system** (generates meaningful analytics)
- **Member management** (full CRUD operations)
- **Contribution tracking** (payment histories and status updates)

## Troubleshooting

### Port Issues
If the seeder can't connect, ensure the backend is running:
```bash
npm run start:dev
```

### Database Issues
If seeding fails, check the database connection and clear if needed:
```bash
npm run seed:dev clear
npm run seed:dev seed
```

### Performance
For large datasets, the seeder may take time due to relationship validations. Monitor the console output for progress.




