using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace POSSystem.Migrations
{
    /// <inheritdoc />
    public partial class SimplifyOnlineOrderModel : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Discount",
                table: "OnlineOrders");

            migrationBuilder.RenameColumn(
                name: "PreparedAt",
                table: "OnlineOrders",
                newName: "NotifiedAt");

            migrationBuilder.AddColumn<int>(
                name: "AcceptedByUserId",
                table: "OnlineOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DeliveredByUserId",
                table: "OnlineOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsNotified",
                table: "OnlineOrders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_OnlineOrders_AcceptedByUserId",
                table: "OnlineOrders",
                column: "AcceptedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_OnlineOrders_DeliveredByUserId",
                table: "OnlineOrders",
                column: "DeliveredByUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_OnlineOrders_Users_AcceptedByUserId",
                table: "OnlineOrders",
                column: "AcceptedByUserId",
                principalTable: "Users",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_OnlineOrders_Users_DeliveredByUserId",
                table: "OnlineOrders",
                column: "DeliveredByUserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_OnlineOrders_Users_AcceptedByUserId",
                table: "OnlineOrders");

            migrationBuilder.DropForeignKey(
                name: "FK_OnlineOrders_Users_DeliveredByUserId",
                table: "OnlineOrders");

            migrationBuilder.DropIndex(
                name: "IX_OnlineOrders_AcceptedByUserId",
                table: "OnlineOrders");

            migrationBuilder.DropIndex(
                name: "IX_OnlineOrders_DeliveredByUserId",
                table: "OnlineOrders");

            migrationBuilder.DropColumn(
                name: "AcceptedByUserId",
                table: "OnlineOrders");

            migrationBuilder.DropColumn(
                name: "DeliveredByUserId",
                table: "OnlineOrders");

            migrationBuilder.DropColumn(
                name: "IsNotified",
                table: "OnlineOrders");

            migrationBuilder.RenameColumn(
                name: "NotifiedAt",
                table: "OnlineOrders",
                newName: "PreparedAt");

            migrationBuilder.AddColumn<decimal>(
                name: "Discount",
                table: "OnlineOrders",
                type: "numeric",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
