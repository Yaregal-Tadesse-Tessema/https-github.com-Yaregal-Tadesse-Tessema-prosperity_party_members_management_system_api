"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../app.module");
const seeder_service_1 = require("./seeder.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const seederService = app.get(seeder_service_1.SeederService);
    const args = process.argv.slice(2);
    const command = args[0];
    try {
        switch (command) {
            case 'seed':
                const membersCount = parseInt(args[1]) || 50;
                const contributionsCount = parseInt(args[2]) || 200;
                console.log('🌱 Starting database seeding...');
                console.log(`📊 Seeding ${membersCount} members and ${contributionsCount} contributions`);
                await seederService.seedMembers(membersCount);
                await seederService.seedContributions(contributionsCount);
                console.log('🎉 Database seeding completed successfully!');
                break;
            case 'clear':
                console.log('🗑️ Clearing all data...');
                await seederService.clearAllData();
                console.log('✅ All data cleared successfully!');
                break;
            case 'members':
                const memberCount = parseInt(args[1]) || 50;
                console.log(`👥 Seeding ${memberCount} members...`);
                await seederService.seedMembers(memberCount);
                console.log('✅ Members seeded successfully!');
                break;
            case 'contributions':
                const contribCount = parseInt(args[1]) || 200;
                console.log(`💰 Seeding ${contribCount} contributions...`);
                await seederService.seedContributions(contribCount);
                console.log('✅ Contributions seeded successfully!');
                break;
            default:
                console.log('Usage:');
                console.log('  npm run seed:dev seed [members=50] [contributions=200]  # Seed all data');
                console.log('  npm run seed:dev members [count=50]                     # Seed only members');
                console.log('  npm run seed:dev contributions [count=200]              # Seed only contributions');
                console.log('  npm run seed:dev clear                                    # Clear all data');
                break;
        }
    }
    catch (error) {
        console.error('❌ Seeding failed:', error.message);
        process.exit(1);
    }
    finally {
        await app.close();
        process.exit(0);
    }
}
bootstrap();
//# sourceMappingURL=seeder.command.js.map