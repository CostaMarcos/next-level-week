import { Request, Response } from 'express';
import { getRepository } from 'typeorm';
import Orphanage from '../model/Orphanage'; 
import orphanageView from '../views/orphanages_view';
import * as Yup from 'yup';

// index, show, create, update, delete

export default {
    async index(req: Request, res: Response) {
        const orphanagesRepository = getRepository(Orphanage);
        const list = await orphanagesRepository.find({ 
          relations: ['images']
        });

            return res.json(orphanageView.renderMany(list));
    },  

    async show(req: Request, res: Response){
        const { id } = req.params;

        try{
            const orphanageRepository = getRepository(Orphanage);
            const orphanage = await orphanageRepository.findOneOrFail(id, {
              relations: ['images']
            });    
            return res.json(orphanageView.render(orphanage));
        } catch(err){
            return res.json({ error: 'can not find orphanage' }).status(404);
        }
    },

  async create(req: Request, res: Response) {
    const { name, latitude, longitude, about, instructions, opening_hours, open_on_weekends } = req.body;

    const orphanagesRepository = getRepository(Orphanage);

    const requestImages = req.files as Express.Multer.File[];
    const images = requestImages.map(images => {
      return { path: images.filename }
    });

    const data = { 
      name, 
      latitude, 
      longitude, 
      about, 
      instructions, 
      opening_hours, 
      open_on_weekends,
      images
    }

    const schema = Yup.object().shape({
      name: Yup.string().required('Nome obrigatório'),
      latitude: Yup.number().required(),
      longitude: Yup.number().required(),
      about: Yup.string().required().max(300),
      instructions: Yup.string().required(),
      opening_hours: Yup.string().required(),
      open_on_weekends: Yup.boolean().required(),
      images: Yup.array(
        Yup.object().shape({
          path: Yup.string().required()
        })
      )
    });
    
    await schema.validate(data, { 
      abortEarly: false 
    });

    const orphanage = orphanagesRepository.create(data);

    await orphanagesRepository.save(orphanage);

    return res.status(201).json(orphanage);   
  
  }
}