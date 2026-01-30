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
exports.PoliciesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const policy_document_entity_1 = require("../../entities/policy-document.entity");
let PoliciesService = class PoliciesService {
    policyRepository;
    constructor(policyRepository) {
        this.policyRepository = policyRepository;
    }
    async create(dto, userId) {
        const doc = this.policyRepository.create({
            ...dto,
            createdBy: userId,
        });
        return this.policyRepository.save(doc);
    }
    async findAll(page = 1, limit = 20, category) {
        const qb = this.policyRepository.createQueryBuilder('p').orderBy('p.createdAt', 'DESC');
        if (category) {
            qb.andWhere('p.category = :category', { category });
        }
        const [items, total] = await qb
            .skip((page - 1) * limit)
            .take(limit)
            .getManyAndCount();
        return { items, total, page, limit };
    }
    async findOne(id) {
        const doc = await this.policyRepository.findOne({ where: { id } });
        if (!doc) {
            throw new common_1.NotFoundException('Policy document not found');
        }
        return doc;
    }
    async update(id, dto) {
        const doc = await this.findOne(id);
        Object.assign(doc, dto);
        return this.policyRepository.save(doc);
    }
    async remove(id) {
        const doc = await this.findOne(id);
        await this.policyRepository.remove(doc);
    }
};
exports.PoliciesService = PoliciesService;
exports.PoliciesService = PoliciesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(policy_document_entity_1.PolicyDocument)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], PoliciesService);
//# sourceMappingURL=policies.service.js.map