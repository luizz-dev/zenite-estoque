ALTER TABLE "empresa" ADD COLUMN "cMunicipio" TEXT NOT NULL DEFAULT '';
ALTER TABLE "notas_fiscais" ADD COLUMN "chaveAcesso" TEXT;
ALTER TABLE "notas_fiscais" ADD COLUMN "protocolo" TEXT;
ALTER TABLE "notas_fiscais" ADD COLUMN "xmlAutorizado" TEXT;
