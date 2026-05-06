using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Noir.Application.DTOs
{
    public class PayAmountRequest
    {
        public decimal Amount { get; set; }

        public string CardNumber { get; set; } = string.Empty;
        public string ExpireMonth {  get; set; } = string.Empty;
        public string ExpireYear { get; set;} = string.Empty;
        public string Cvc { get; set; } = string.Empty;
    }
}
