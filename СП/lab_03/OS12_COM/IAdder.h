#pragma once
#include <objbase.h>
#include <Unknwn.h>

// {02FE8A5E-281B-4E3A-8F87-6C544DEDA994}
static const IID IID_IADDER =
{ 0x02fe8a5e, 0x281b, 0x4e3a, { 0x8f, 0x87, 0x6c, 0x54, 0x4d, 0xed, 0xa9, 0x94 } };

__interface IAdder : IUnknown {
	virtual HRESULT __stdcall Add(const double x, 
								  const double y, 
								  double& z) = 0; // результат z = x + y

	virtual HRESULT __stdcall Sub(const double x, 
								  const double y, 
								  double& z) = 0; // результат z = x - y
};