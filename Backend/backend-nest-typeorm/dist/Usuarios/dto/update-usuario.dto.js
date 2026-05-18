"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateUsuarioDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_usurio_dto_1 = require("./create-usurio-dto");
class UpdateUsuarioDto extends (0, swagger_1.PartialType)((0, swagger_1.OmitType)(create_usurio_dto_1.CreateUsuarioDto, ['password_hash'])) {
}
exports.UpdateUsuarioDto = UpdateUsuarioDto;
//# sourceMappingURL=update-usuario.dto.js.map