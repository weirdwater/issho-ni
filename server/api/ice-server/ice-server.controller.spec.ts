import { Test, TestingModule } from '@nestjs/testing';
import { IceServerController } from './ice-server.controller';

describe('IceServer Controller', () => {
  let controller: IceServerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IceServerController],
    }).compile();

    controller = module.get<IceServerController>(IceServerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
