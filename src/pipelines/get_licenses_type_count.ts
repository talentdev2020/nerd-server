export const getLicensesTypesCountsPipeline = (userId: string) => [
    {
        $match: { userId },
    },
    {
        $group:
        {
            _id: "$licenseTypeId",
            inUseCount: { $sum: { $cond: ["$inUse", 1, 0] } },
            count: { $sum: 1 },
        },
    },
    {
        $lookup: {
            from: 'license-types',
            let: { licenseTypeId: '$_id' },
            pipeline: [
                {
                    $match: {
                        $expr: {
                            $eq: ['$id', '$$licenseTypeId'],
                        },
                    },
                },
                {
                    $project: {
                        _id: 0,
                        name: 1,
                        rewardType: 1,
                        nodeType: {
                            $cond: [
                                {
                                    $or: [
                                        "$fullNode",
                                        { $eq: ["$nodeType", 'large'] },
                                    ],
                                },
                                'large',
                                'small',
                            ],
                        },
                    },
                },
            ],
            as: 'licenseTypes',
        },
    },
    {
        $addFields: {
            name: { $ifNull: [{ $first: "$licenseTypes.name" }, 'No license type Name'] },
            rewardType: { $ifNull: [{ $first: "$licenseTypes.rewardType" }, 'No license type Reward'] },
            nodeType: { $ifNull: [{ $first: "$licenseTypes.nodeType" }, 'No license Node type'] },
            licenseTypes: "$$REMOVE",
            _id: "$$REMOVE",
        },
    },
]