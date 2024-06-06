const { TableClient } = require("@azure/data-tables");

module.exports = async function (context, req) {
    context.log('VisitorCounter function started.');

    const connectionString = process.env["CosmosDBConnectionString"];
    const tableName = "visitorcounter";
    const rowKey = "count";

    const tableClient = TableClient.fromConnectionString(connectionString, tableName);

    try {
        // Ensure the table (container) exists
        try {
            await tableClient.createTable();
        } catch (error) {
            if (error.statusCode !== 409) { // 409 means the table already exists
                throw error;
            }
        }

        let entity;
        try {
            entity = await tableClient.getEntity("visitor", rowKey); // Use a constant value for partition key
            entity = {
                partitionKey: entity.partitionKey,
                rowKey: entity.rowKey,
                count: entity.count + 1
            };
            await tableClient.updateEntity(entity, "Merge");
        } catch (error) {
            if (error.statusCode === 404) {
                entity = { partitionKey: "visitor", rowKey, count: 1 }; // Use a constant value for partition key
                await tableClient.createEntity(entity);
            } else {
                throw error;
            }
        }

        context.res = {
            status: 200,
            body: { count: entity.count }
        };
    } catch (error) {
        context.log(`Error in VisitorCounter function: ${error.message}`);
        context.res = {
            status: 500,
            body: { error: error.message }
        };
    }

    context.log('VisitorCounter function finished.');
};


