const cron = require('node-cron');
const { courseModel } = require('../models');
const mailService = require('./email');

const getCurrentTime = () => {
    const dateObj = new Date();
    const hour = dateObj.getHours();
    const minute = dateObj.getMinutes();
    const date = `${dateObj.getFullYear()}-${
        dateObj.getMonth() + 1
    }-${dateObj.getDate()}`;

    const currentTime = new Date(date);
    currentTime.setHours(hour);
    currentTime.setMinutes(minute);
    currentTime.setDate(currentTime.getDate());

    return currentTime;
};

const courseService = {
    getByNow: async (fields) => {
        const currentTime = getCurrentTime();

        const users = await courseModel.aggregate([
            { $unwind: '$examinations' },
            { $match: { 'examinations.time': currentTime } },
            { $project: { author: 1, examinations: 1 } },
        ]);

        return await courseModel.populate(users, {
            path: 'author',
            select: 'email',
        });
    },

    startExamReminderScheduler: function () {
        cron.schedule('0 * * * * *', async () => {
            const reminders = await this.getByNow();
            reminders.forEach(async (reminder) => {
                const email = reminder.author.email;
                const {
                    title,
                    content,
                    _id: reminderId,
                } = reminder.examinations;

                await mailService.sendMail({
                    to: email,
                    subject: 'An important event within the next 2 days',
                    content: `<p>Your Reminder: ${content}</p><br><p>${title}</p>`,
                });

                await this.update(
                    { _id: reminder._id },
                    { $pull: { examinations: { _id: reminderId } } }
                );
            });
        });
    },

    getOne: async (payloads, field, locale = true) => {
        const res = await courseModel
            .findOne(payloads, field)
            .populate('author')
            .lean();

        if (locale) {
            res.examinations.map((item) => {
                item.time = item.time.toLocaleString('vi-VN');
            });
        }
        return res;
    },

    get: async (payloads, field, locale = true) => {
        const res = await courseModel
            .find(payloads, field)
            .populate('author')
            .lean();
        if (locale) {
            res.map((item) => {
                item.examinations.map((x) => {
                    x.time = x.time.toLocaleString('vi-VN');
                });
            });
        }
        return res;
    },

    create: async (payloads) => {
        return await courseModel.create(payloads);
    },

    update: async (conditions, payloads) => {
        return await courseModel.findOneAndUpdate(conditions, payloads, {
            runValidators: true,
        });
    },

    delete: async (conditions) => {
        return await courseModel.findOneAndDelete(conditions);
    },
};

module.exports = courseService;
