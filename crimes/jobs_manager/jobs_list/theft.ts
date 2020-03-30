import { Container } from 'typedi';

import { Redis } from '../../cache/redis';
import { KafkaClient } from '../../pubsub/kafka/index';
import { CrimesService } from '../../services';
import { AgendaScheduler } from '../Agenda';
import { THEFT_JOB } from '../constants';

const agendaInstance = Container.get(AgendaScheduler);
const crimeService = Container.get(CrimesService);
const kafkaClient = Container.get(KafkaClient);
const redisInstance = Container.get(Redis);

agendaInstance.agenda.define(THEFT_JOB, async () => {
    const KAFKA_TOPIC = 'kafka-test';
    const MODEL = 'chicago_crimes';
    const CASE_TYPE = 'THEFT';
    const LIMIT = 1000;
    const currentOffset = await redisInstance.getDataFromRedis(THEFT_JOB) || 0;
    const newOffset = currentOffset + LIMIT;

    const data = await crimeService.getCrimeData({
        model: MODEL,
        offset: currentOffset,
        limit: LIMIT,
        caseType: CASE_TYPE,
    });

    redisInstance.addDataToRedis(THEFT_JOB, newOffset);

    await kafkaClient.publish({
        topic: KAFKA_TOPIC,
        message: data,
    });
});

agendaInstance.agenda.start();
agendaInstance.agenda.every('5 minutes', THEFT_JOB)
