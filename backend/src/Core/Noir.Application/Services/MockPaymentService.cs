using Noir.Application.DTOs;
using Noir.Application.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.Services
{
    public class MockPaymentService : IPaymentService
    {
        public async Task<PaymentResult>  ProcessPaymentAsync(decimal amount, string cardNumber, string expireMonth, string expireYear, string cvc)
        {
            await Task.Delay(1500);

            if (string.IsNullOrWhiteSpace(cardNumber) || cardNumber.Length < 16)
            {
                return new PaymentResult { IsSuccess = false, Message = "Geçersiz veya eksik kart numarası." };
            }

            if (cvc == "000")
            {
                return new PaymentResult { IsSuccess = false, Message = "İşlem banka tarafından reddedildi. Bakiye yetersiz." };
            }

            return new PaymentResult
            {
                IsSuccess = true,
                Message = "Ödeme başarıyla alındı.",
                TransactionId = $"NOIR-{Guid.NewGuid().ToString().Substring(0, 8).ToUpper()}"
            };




        }
    }
}
