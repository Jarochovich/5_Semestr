#pragma once
#include <objbase.h>
#include <Unknwn.h>

static const CLSID IID_IMULTIPLIER =
{ 0xe0d12322, 0xad3a, 0x294e, {0x42, 0x98, 0x8d, 0x3c, 0x3e, 0xed, 0x64, 0xd8} };

__interface IMultiplier : IUnknown {
	virtual HRESULT __stdcall Mul(const double x, 
								  const double y, 
								  double& z) = 0;   // результат z = x * y

	virtual HRESULT __stdcall Div(const double x, 
								  const double y, 
								  double& z) = 0;	// результат z = x / y
};