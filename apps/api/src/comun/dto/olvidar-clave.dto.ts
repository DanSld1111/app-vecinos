import { IsEmail } from "class-validator";

export class OlvidarClaveDto {
  @IsEmail()
  correo!: string;
}
